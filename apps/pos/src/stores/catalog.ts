import { ref, watch, computed, onMounted } from 'vue'
import { defineStore } from 'pinia'
import { useDiscountStore } from '@/stores/discount'
import type { CartLineItem, Category, ModifierGroup, ModifierOption, Product } from '@/types'
import { fromSelection } from '@/utils/selection'

export const useCatalogStore = defineStore(
  'catalog',
  () => {
    const discountStore = useDiscountStore()
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

    const productPanel = ref(0)
    const selectedCategoryId = ref('')
    const selectedProduct = ref<Product | []>([])
    const selectedModifiers = ref<Record<string, string[]>>({})
    const productCount = ref('1')
    const cartLines = ref<CartLineItem[]>([])

    const modifierGroupsOf = (product: Product | undefined) =>
      (product?.modifierGroupIds ?? [])
        .map((groupId) =>
          modifierGroups.value.find((group) => String(group.id) === String(groupId))
        )
        .filter((group): group is ModifierGroup => group !== undefined)

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
        selectedModifiers.value = JSON.parse(JSON.stringify(line.selectedModifiers))
      } else {
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
      // 重置為 1 避免未調整數量直接新增時因預設 0 觸發校驗失敗。
      productCount.value = "1"
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
    // initialized 防止持久化還原時 cartLines 觸發重置。
    const cartClearedNotice = ref(0)
    // 抑制外部已自行提示情境下的重複 toast。
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
