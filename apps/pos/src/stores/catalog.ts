import { ref, watch, computed, onMounted } from 'vue'
import { defineStore } from 'pinia'
import { useDiscountStore } from '@/stores/discount'
import type { CartLineItem, Category, ModifierGroup, ModifierOption, Product } from '@/types'
import { fromSelection } from '@/utils/selection'

export const useCatalogStore = defineStore(
  'catalog',
  () => {
    // 必須在 setup 函式內呼叫，確保一定在 Pinia 初始化完成之後才執行。
    const discountStore = useDiscountStore()

    // 這裡的陣列是離線種子資料，正常由 apps/api 當唯一來源（見
    // src/api/catalog.ts）。開機拿得到伺服端資料就整份覆蓋這裡（見下方
    // hydrateCatalogFromServer）；種子資料只在離線／伺服端連不上時當作
    // 最後手段的畫面內容，不會跟真正的菜單資料混在一起比對合併。

    // 展示用種子資料：跨主餐/輕食/飲品/甜點的示範菜單，證明這套目錄模型
    // 不綁定單一產業——熟度、甜度/冰塊/容器大小都是可掛用的規格群組，不是
    // 寫死在品項欄位裡（見 apps/api/seed/catalog.sql 的伺服端版本）。
    const categories = ref<Category[]>([
      { id: 'cat-1', name: '主餐' },
      { id: 'cat-2', name: '輕食' },
      { id: 'cat-3', name: '飲品' },
      { id: 'cat-4', name: '甜點' }
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
          { id: 'mo-doneness-3', name: '全熟', priceDelta: 0 }
        ]
      },
      {
        id: 'mg-sweetness',
        name: '甜度',
        selectionType: 'single',
        required: true,
        options: [
          { id: 'mo-sweetness-1', name: '無糖', priceDelta: 0 },
          { id: 'mo-sweetness-2', name: '半糖', priceDelta: 0 },
          { id: 'mo-sweetness-3', name: '正常糖', priceDelta: 0 }
        ]
      },
      {
        id: 'mg-ice',
        name: '冰塊',
        selectionType: 'single',
        required: true,
        options: [
          { id: 'mo-ice-1', name: '去冰', priceDelta: 0 },
          { id: 'mo-ice-2', name: '少冰', priceDelta: 0 },
          { id: 'mo-ice-3', name: '正常冰', priceDelta: 0 }
        ]
      },
      {
        id: 'mg-size',
        name: '容器大小',
        selectionType: 'single',
        required: true,
        options: [
          { id: 'mo-size-1', name: '中杯', priceDelta: 0 },
          { id: 'mo-size-2', name: '大杯', priceDelta: 10 }
        ]
      },
      // 「加購」不是獨立概念，只是 selectionType='multiple'、required=false 的
      // 規格群組，一樣只掛在有掛用它的品項上（見下方 products 的 modifierGroupIds）
      // ——漢堡加料不會出現在飲料底下，反之亦然。
      {
        id: 'mg-burger-topping',
        name: '漢堡加料',
        selectionType: 'multiple',
        required: false,
        options: [
          { id: 'mo-burger-topping-1', name: '加起司', priceDelta: 20 },
          { id: 'mo-burger-topping-2', name: '加蛋', priceDelta: 15 }
        ]
      },
      {
        id: 'mg-drink-topping',
        name: '飲料加料',
        selectionType: 'multiple',
        required: false,
        options: [
          { id: 'mo-drink-topping-1', name: '珍珠', priceDelta: 10, stock: 30 },
          { id: 'mo-drink-topping-2', name: '椰果', priceDelta: 10, stock: 30 }
        ]
      }
    ])

    const products = ref<Product[]>([
      {
        id: 'prod-1',
        categoryId: 'cat-1',
        name: '招牌牛肉漢堡',
        basePrice: 180,
        stock: 30,
        modifierGroupIds: ['mg-doneness', 'mg-burger-topping']
      },
      {
        id: 'prod-2',
        categoryId: 'cat-1',
        name: '烤雞三明治',
        basePrice: 150,
        stock: 30,
        modifierGroupIds: []
      },
      {
        id: 'prod-3',
        categoryId: 'cat-1',
        name: '奶油培根義大利麵',
        basePrice: 190,
        stock: null,
        modifierGroupIds: []
      },
      {
        id: 'prod-4',
        categoryId: 'cat-2',
        name: '凱薩沙拉',
        basePrice: 120,
        stock: null,
        modifierGroupIds: []
      },
      {
        id: 'prod-5',
        categoryId: 'cat-2',
        name: '薯條',
        basePrice: 60,
        stock: null,
        modifierGroupIds: []
      },
      {
        id: 'prod-6',
        categoryId: 'cat-2',
        name: '雞塊六入',
        basePrice: 80,
        stock: null,
        modifierGroupIds: []
      },
      {
        id: 'prod-7',
        categoryId: 'cat-3',
        name: '翡翠綠茶',
        basePrice: 30,
        stock: 100,
        modifierGroupIds: ['mg-sweetness', 'mg-ice', 'mg-size', 'mg-drink-topping']
      },
      {
        id: 'prod-8',
        categoryId: 'cat-3',
        name: '鮮奶紅茶拿鐵',
        basePrice: 60,
        stock: 100,
        modifierGroupIds: ['mg-sweetness', 'mg-ice', 'mg-size', 'mg-drink-topping']
      },
      {
        id: 'prod-9',
        categoryId: 'cat-3',
        name: '美式咖啡',
        basePrice: 50,
        stock: null,
        modifierGroupIds: []
      },
      {
        id: 'prod-10',
        categoryId: 'cat-3',
        name: '現榨柳橙汁',
        basePrice: 70,
        stock: 40,
        modifierGroupIds: ['mg-ice', 'mg-size']
      },
      {
        id: 'prod-11',
        categoryId: 'cat-4',
        name: '提拉米蘇',
        basePrice: 90,
        stock: 15,
        modifierGroupIds: []
      },
      {
        id: 'prod-12',
        categoryId: 'cat-4',
        name: '布朗尼',
        basePrice: 75,
        stock: 15,
        modifierGroupIds: []
      }
    ])

    // 0：規格客製；非 0：加購選項。
    const productPanel = ref(0)
    const selectedCategoryId = ref('')
    const selectedProduct = ref<Product | []>([])
    // 已選規格／加購：groupId -> 選中的 optionId 清單（單選群組最多 1 筆，
    // 多選群組可多筆）。加購不再另外用 selectedAddOnList 存一份完整物件，
    // 跟規格共用同一份選擇狀態——加購本來就只是 selectionType='multiple'
    // 的規格群組。
    const selectedModifiers = ref<Record<string, string[]>>({})
    const productCount = ref('0')
    const cartLines = ref<CartLineItem[]>([])

    const modifierGroupsOf = (product: Product | undefined) =>
      (product?.modifierGroupIds ?? [])
        .map((groupId) =>
          modifierGroups.value.find((group) => String(group.id) === String(groupId))
        )
        .filter((group): group is ModifierGroup => group !== undefined)

    // 規格（單選，通常必選，如熟度／甜度）併入品名字串顯示；加購（多選，
    // 通常非必選，如加起司／珍珠）另外列成 addList 徽章清單——用
    // selectionType 分流，不是另外開一張表。
    const specGroupsOf = (product: Product | undefined) =>
      modifierGroupsOf(product).filter((group) => group.selectionType === 'single')
    const addOnGroupsOf = (product: Product | undefined) =>
      modifierGroupsOf(product).filter((group) => group.selectionType === 'multiple')

    const selectedOptionsOf = (groups: ModifierGroup[]): ModifierOption[] =>
      groups.flatMap((group) => {
        const optionIds = selectedModifiers.value[String(group.id)] ?? []
        return group.options.filter((option) => optionIds.includes(String(option.id)))
      })

    const selectedModifierNames = computed(() => {
      const product = fromSelection(selectedProduct.value)
      return selectedOptionsOf(specGroupsOf(product)).map((option) => option.name)
    })
    const selectedModifierPriceDelta = computed(() =>
      selectedOptionsOf(specGroupsOf(fromSelection(selectedProduct.value))).reduce(
        (sum, option) => sum + Number(option.priceDelta),
        0
      )
    )
    const selectedAddOnOptions = computed(() =>
      selectedOptionsOf(addOnGroupsOf(fromSelection(selectedProduct.value)))
    )
    const selectedAddOnPriceDelta = computed(() =>
      selectedAddOnOptions.value.reduce((sum, option) => sum + Number(option.priceDelta), 0)
    )
    const requiredModifiersSatisfied = computed(() => {
      const product = fromSelection(selectedProduct.value)
      return modifierGroupsOf(product).every(
        (group) => !group.required || (selectedModifiers.value[String(group.id)]?.length ?? 0) > 0
      )
    })

    const productCurrentTotal = computed(() => {
      const product = fromSelection(selectedProduct.value)
      if (!product) return 0
      const unitPrice =
        Number(product.basePrice) + selectedModifierPriceDelta.value + selectedAddOnPriceDelta.value
      return unitPrice * Number(productCount.value)
    })

    const cartTotalMoney = computed(() => {
      return (
        Math.round(cartLines.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) +
        currentBagCount.value
      )
    })
    const currentItemCount = computed(() => {
      return cartLines.value.length > 0
        ? cartLines.value.reduce((acc, cur) => acc + cur.count, 0)
        : 0
    })

    const editingLine = ref<CartLineItem | null>(null)
    const isSuppressingProductReset = ref(false)

    const startEditLine = (line: CartLineItem) => {
      const baseName = line.name.split(",")[0]?.trim() ?? ""
      const targetProduct = line.productId
        ? products.value.find((p) => String(p.id) === String(line.productId))
        : products.value.find((p) => p.name === baseName)

      if (!targetProduct) return false

      isSuppressingProductReset.value = true
      editingLine.value = line
      selectedCategoryId.value = String(targetProduct.categoryId)
      selectedProduct.value = targetProduct
      productCount.value = String(line.count)

      if (line.selectedModifiers) {
        // 新格式快照已經同時含規格與加購（見 addNewProduct／saveEdit），整份沿用。
        selectedModifiers.value = JSON.parse(JSON.stringify(line.selectedModifiers))
      } else {
        // 舊格式購物車（合併加購選項模型之前存的）沒有 selectedModifiers 快照，
        // 只能從展示字串回查：規格是品名逗號後的「選項1/選項2」，加購是
        // addList 名稱陣列——分別對回 specGroupsOf／addOnGroupsOf 的選項名稱。
        const mods: Record<string, string[]> = {}
        const modPart = line.name.split(",")[1]
        if (modPart) {
          const optNames = modPart.split("/")
          for (const g of specGroupsOf(targetProduct)) {
            const matched = g.options.filter((opt) => optNames.includes(opt.name))
            if (matched.length > 0) mods[String(g.id)] = matched.map((m) => String(m.id))
          }
        }
        const addNames = Array.isArray(line.addList)
          ? line.addList
          : line.addList && line.addList !== "無添加配料"
            ? [line.addList]
            : []
        if (addNames.length > 0) {
          for (const g of addOnGroupsOf(targetProduct)) {
            const matched = g.options.filter((opt) => addNames.includes(opt.name))
            if (matched.length > 0) mods[String(g.id)] = matched.map((m) => String(m.id))
          }
        }
        selectedModifiers.value = mods
      }

      productPanel.value = 0

      setTimeout(() => {
        isSuppressingProductReset.value = false
      }, 50)

      return true
    }

    const cancelEditLine = () => {
      editingLine.value = null
      selectedCategoryId.value = ""
      selectedProduct.value = []
      selectedModifiers.value = {}
      productCount.value = "0"
    }

    watch(
      () => selectedCategoryId.value,
      () => {
        if (isSuppressingProductReset.value) return
        selectedProduct.value = []
        selectedModifiers.value = {}
      }
    )
    watch(
      () => selectedProduct.value,
      () => {
        if (isSuppressingProductReset.value) return
        selectedModifiers.value = {}
      }
    )

    const initialized = ref(false)
    onMounted(() => {
      initialized.value = true
      editingLine.value = null
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
    watch(
      () => cartLines.value,
      () => {
        if (!initialized.value) return
        if (cartLines.value.length === 0) {
          currentBagCount.value = 0
          discountStore.selectingOrderCouponId = 0
          discountStore.orderCouponId = 0
          discountStore.currentDiscountName = ''
          if (!suppressClearedNotice.value) {
            cartClearedNotice.value++
          }
        }
      }
    )

    // 額外費用（包材／服務費等），沿用舊版「加購袋子」的計數 × 1元機制，
    // 只是不再限定是外帶飲料店的袋子。
    const currentBagCount = ref(0)
    const cartPayPrice = computed(() => {
      const subtotal =
        Math.round(cartLines.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) +
        currentBagCount.value
      const coupon = discountStore.orderCoupons.find(
        (item) => item.id === discountStore.orderCouponId
      )
      if (!coupon) return subtotal
      return coupon.kind === 'amount'
        ? Math.max(0, Math.round(subtotal - Number(coupon.value)))
        : Math.max(0, Math.round(subtotal * Number(coupon.value)))
    })
    const useDiscountPrice = computed(() => {
      return (
        Math.round(cartLines.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) +
        currentBagCount.value -
        cartPayPrice.value
      )
    })

    // 開機每次拿到伺服端資料都整份覆蓋——D1 已經是可信賴的持久層，管理端的
    // 異動也都直接寫進去，不需要再靠「只信任本機」來防止被蓋掉；反而是只信
    // 任本機會讓多裝置／多分頁各自卡在自己最後一次同步的舊資料出不來。
    const hydrateCatalogFromServer = (catalog: {
      categories: Category[]
      products: Product[]
      modifierGroups: ModifierGroup[]
    }) => {
      categories.value = catalog.categories
      products.value = catalog.products
      modifierGroups.value = catalog.modifierGroups
    }

    return {
      hydrateCatalogFromServer,
      categories,
      products,
      modifierGroups,
      productPanel,
      selectedCategoryId,
      selectedProduct,
      selectedModifiers,
      productCount,
      cartLines,
      modifierGroupsOf,
      specGroupsOf,
      addOnGroupsOf,
      selectedModifierNames,
      selectedModifierPriceDelta,
      selectedAddOnOptions,
      selectedAddOnPriceDelta,
      requiredModifiersSatisfied,
      productCurrentTotal,
      cartPayPrice,
      currentBagCount,
      useDiscountPrice,
      cartTotalMoney,
      cartClearedNotice,
      suppressClearedNotice,
      currentItemCount,
      editingLine,
      startEditLine,
      cancelEditLine
    }
  },
  {
    persist: true
  }
)
