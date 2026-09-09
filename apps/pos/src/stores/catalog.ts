import { ref, watch, computed, onMounted } from 'vue'
import { defineStore } from 'pinia'
import { useDiscountStore } from '@/stores/discount'
import type { AddOnOption, CartLineItem, Category, ModifierGroup, Product } from '@/types'
import { fromSelection } from '@/utils/selection'

export const useCatalogStore = defineStore('catalog', () => {
  // 必須在 setup 函式內呼叫，確保一定在 Pinia 初始化完成之後才執行。
  const discountStore = useDiscountStore()

  // 這裡的陣列是離線種子資料，正常由 apps/api 當唯一來源（見
  // src/api/catalog.ts）。catalogSource 只在「這個瀏覽器從未同步過伺服端
  // 菜單」時套用一次 hydrateCatalogFromServer()，之後永遠以本機（可能已
  // 被管理員編輯過）的資料為準，避免每次啟動都覆蓋管理員的異動。
  const catalogSource = ref<'seed' | 'server'>('seed')

  // 展示用種子資料：跨主餐/輕食/飲品/甜點的示範菜單，證明這套目錄模型
  // 不綁定單一產業——熟度、甜度/冰塊/容器大小都是可掛用的規格群組，不是
  // 寫死在品項欄位裡（見 apps/api/seed/catalog.sql 的伺服端版本）。
  const categories = ref<Category[]>([
    { id: 'cat-1', name: '主餐' },
    { id: 'cat-2', name: '輕食' },
    { id: 'cat-3', name: '飲品' },
    { id: 'cat-4', name: '甜點' },
  ])

  const modifierGroups = ref<ModifierGroup[]>([
    {
      id: 'mg-doneness',
      name: '熟度',
      selectionType: 'single',
      required: true,
      options: [
        { id: 'mo-doneness-1', name: '五分熟', priceDelta: 0 },
        { id: 'mo-doneness-2', name: '七分熟', priceDelta: 0 },
        { id: 'mo-doneness-3', name: '全熟', priceDelta: 0 },
      ],
    },
    {
      id: 'mg-sweetness',
      name: '甜度',
      selectionType: 'single',
      required: true,
      options: [
        { id: 'mo-sweetness-1', name: '無糖', priceDelta: 0 },
        { id: 'mo-sweetness-2', name: '半糖', priceDelta: 0 },
        { id: 'mo-sweetness-3', name: '正常糖', priceDelta: 0 },
      ],
    },
    {
      id: 'mg-ice',
      name: '冰塊',
      selectionType: 'single',
      required: true,
      options: [
        { id: 'mo-ice-1', name: '去冰', priceDelta: 0 },
        { id: 'mo-ice-2', name: '少冰', priceDelta: 0 },
        { id: 'mo-ice-3', name: '正常冰', priceDelta: 0 },
      ],
    },
    {
      id: 'mg-size',
      name: '容器大小',
      selectionType: 'single',
      required: true,
      options: [
        { id: 'mo-size-1', name: '中杯', priceDelta: 0 },
        { id: 'mo-size-2', name: '大杯', priceDelta: 10 },
      ],
    },
  ])

  const products = ref<Product[]>([
    { id: 'prod-1', categoryId: 'cat-1', name: '招牌牛肉漢堡', basePrice: 180, stock: 30, modifierGroupIds: ['mg-doneness'] },
    { id: 'prod-2', categoryId: 'cat-1', name: '烤雞三明治', basePrice: 150, stock: 30, modifierGroupIds: [] },
    { id: 'prod-3', categoryId: 'cat-1', name: '奶油培根義大利麵', basePrice: 190, stock: null, modifierGroupIds: [] },
    { id: 'prod-4', categoryId: 'cat-2', name: '凱薩沙拉', basePrice: 120, stock: null, modifierGroupIds: [] },
    { id: 'prod-5', categoryId: 'cat-2', name: '薯條', basePrice: 60, stock: null, modifierGroupIds: [] },
    { id: 'prod-6', categoryId: 'cat-2', name: '雞塊六入', basePrice: 80, stock: null, modifierGroupIds: [] },
    { id: 'prod-7', categoryId: 'cat-3', name: '翡翠綠茶', basePrice: 30, stock: 100, modifierGroupIds: ['mg-sweetness', 'mg-ice', 'mg-size'] },
    { id: 'prod-8', categoryId: 'cat-3', name: '鮮奶紅茶拿鐵', basePrice: 60, stock: 100, modifierGroupIds: ['mg-sweetness', 'mg-ice', 'mg-size'] },
    { id: 'prod-9', categoryId: 'cat-3', name: '美式咖啡', basePrice: 50, stock: null, modifierGroupIds: [] },
    { id: 'prod-10', categoryId: 'cat-3', name: '現榨柳橙汁', basePrice: 70, stock: 40, modifierGroupIds: ['mg-ice', 'mg-size'] },
    { id: 'prod-11', categoryId: 'cat-4', name: '提拉米蘇', basePrice: 90, stock: 15, modifierGroupIds: [] },
    { id: 'prod-12', categoryId: 'cat-4', name: '布朗尼', basePrice: 75, stock: 15, modifierGroupIds: [] },
  ])

  const addOns = ref<AddOnOption[]>([
    { id: 'addon-1', name: '加起司', price: 20 },
    { id: 'addon-2', name: '加蛋', price: 15 },
    { id: 'addon-3', name: '加培根', price: 25 },
    { id: 'addon-4', name: '珍珠', price: 10 },
    { id: 'addon-5', name: '布丁', price: 15 },
    { id: 'addon-6', name: '椰果', price: 10 },
  ])

  // 0：規格客製；非 0：加購選項。
  const productPanel = ref(0)
  const selectedCategoryId = ref('')
  const selectedProduct = ref<Product | []>([])
  // 已選規格：groupId -> 選中的 optionId 清單（單選群組最多 1 筆，多選群組可多筆）。
  const selectedModifiers = ref<Record<string, string[]>>({})
  const selectedAddOnList = ref<AddOnOption[]>([])
  const productCount = ref('0')
  const cartLines = ref<CartLineItem[]>([])

  const modifierGroupsOf = (product: Product | undefined) =>
    (product?.modifierGroupIds ?? [])
      .map((groupId) => modifierGroups.value.find((group) => String(group.id) === String(groupId)))
      .filter((group): group is ModifierGroup => group !== undefined)

  const selectedModifierNames = computed(() => {
    const product = fromSelection(selectedProduct.value)
    return modifierGroupsOf(product).flatMap((group) => {
      const optionIds = selectedModifiers.value[String(group.id)] ?? []
      return group.options.filter((option) => optionIds.includes(String(option.id))).map((option) => option.name)
    })
  })
  const selectedModifierPriceDelta = computed(() => {
    const product = fromSelection(selectedProduct.value)
    return modifierGroupsOf(product).reduce((sum, group) => {
      const optionIds = selectedModifiers.value[String(group.id)] ?? []
      const delta = group.options
        .filter((option) => optionIds.includes(String(option.id)))
        .reduce((acc, option) => acc + Number(option.priceDelta), 0)
      return sum + delta
    }, 0)
  })
  const requiredModifiersSatisfied = computed(() => {
    const product = fromSelection(selectedProduct.value)
    return modifierGroupsOf(product).every((group) => !group.required || (selectedModifiers.value[String(group.id)]?.length ?? 0) > 0)
  })

  const productCurrentTotal = computed(() => {
    const product = fromSelection(selectedProduct.value)
    if (!product) return 0
    const addOnTotal = selectedAddOnList.value.reduce((acc, cur) => acc + Number(cur.price), 0)
    const unitPrice = Number(product.basePrice) + selectedModifierPriceDelta.value + addOnTotal
    return unitPrice * Number(productCount.value)
  })

  const cartTotalMoney = computed(() => {
    return Math.round(cartLines.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) + currentBagCount.value
  })
  const currentItemCount = computed(() => {
    return cartLines.value.length > 0 ? cartLines.value.reduce((acc, cur) => acc + cur.count, 0) : 0
  })

  watch(() => selectedCategoryId.value, () => {
    selectedProduct.value = []
    selectedModifiers.value = {}
    selectedAddOnList.value = []
  })
  watch(() => selectedProduct.value, () => {
    selectedModifiers.value = {}
    selectedAddOnList.value = []
  })

  const initialized = ref(false)
  onMounted(() => {
    initialized.value = true
  })
  // store（狀態層）不直接彈窗，只遞增計數器；UI 提示交給實際顯示畫面的
  // 元件（home/index.vue）自己 watch 這個計數器。initialized 守衛防的是
  // pinia-plugin-persistedstate 還原持久化狀態時，cartLines 被重新賦值
  // 觸發這個 watch，搶在 discountStore 也還原完成前就把它重置成 0。
  const cartClearedNotice = ref(0)
  // 掛單也會清空 cartLines（購物車搬進 Dexie 之後清掉），跟結帳後清空
  // 是同一個 watch 觸發點，但掛單當下已經另外彈過「已掛單」的 toast（見
  // components/checkout/ParkedOrdersPanel.vue），不需要再疊加一次語意
  // 不符的提示——這個旗標只抑制「彈提示」，清空額外費用／重置優惠券兩件
  // 事仍照做。
  const suppressClearedNotice = ref(false)
  watch(() => cartLines.value, () => {
    if (!initialized.value) return
    if (cartLines.value.length === 0) {
      currentBagCount.value = 0
      discountStore.moneySelectingDiscountId = 0
      discountStore.moneyDiscountId = 0
      discountStore.currentMoneyDiscount = 0
      discountStore.percentDiscountId = 0
      discountStore.currentPercentDiscount = 0
      discountStore.percentSelectingDiscountId = 0
      discountStore.currentDiscountName = ''
      if (!suppressClearedNotice.value) {
        cartClearedNotice.value++
      }
    }
  })

  // 額外費用（包材／服務費等），沿用舊版「加購袋子」的計數 × 1元機制，
  // 只是不再限定是外帶飲料店的袋子。
  const currentBagCount = ref(0)
  const cartPayPrice = computed(() => {
    const subtotal = Math.round(cartLines.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) + currentBagCount.value
    if (discountStore.moneyDiscountId != 0) {
      return Math.max(0, Math.round(subtotal - Number(discountStore.currentMoneyDiscount)))
    } else if (discountStore.percentDiscountId != 0) {
      return Math.round(subtotal * Number(discountStore.currentPercentDiscount))
    } else {
      return subtotal
    }
  })
  const useDiscountPrice = computed(() => {
    return Math.round(cartLines.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) + currentBagCount.value - cartPayPrice.value
  })

  // 見上方 catalogSource 的說明：只在第一次套用，之後不會再覆蓋本機資料。
  const hydrateCatalogFromServer = (catalog: {
    categories: Category[]
    products: Product[]
    modifierGroups: ModifierGroup[]
    addOns: AddOnOption[]
  }) => {
    if (catalogSource.value === 'server') return
    categories.value = catalog.categories
    products.value = catalog.products
    modifierGroups.value = catalog.modifierGroups
    addOns.value = catalog.addOns
    catalogSource.value = 'server'
  }

  return {
    catalogSource,
    hydrateCatalogFromServer,
    categories,
    products,
    modifierGroups,
    addOns,
    productPanel,
    selectedCategoryId,
    selectedProduct,
    selectedModifiers,
    selectedAddOnList,
    productCount,
    cartLines,
    modifierGroupsOf,
    selectedModifierNames,
    selectedModifierPriceDelta,
    requiredModifiersSatisfied,
    productCurrentTotal,
    cartPayPrice,
    currentBagCount,
    useDiscountPrice,
    cartTotalMoney,
    cartClearedNotice,
    suppressClearedNotice,
    currentItemCount,
  }
}, {
  persist: true,
})
