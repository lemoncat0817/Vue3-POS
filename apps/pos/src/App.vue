<template>
  <RouterView />
  <ConfirmDialogHost />
  <ToastHost />
  <PromptDialogHost />
  <RefundDialogHost />
  <ManagerAuthDialogHost />
  <ReceiptPreviewDialogHost />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import ConfirmDialogHost from '@/components/ui/ConfirmDialogHost.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import PromptDialogHost from '@/components/ui/PromptDialogHost.vue'
import RefundDialogHost from '@/components/ui/RefundDialogHost.vue'
import ManagerAuthDialogHost from '@/components/ui/ManagerAuthDialogHost.vue'
import ReceiptPreviewDialogHost from '@/components/ui/ReceiptPreviewDialogHost.vue'
import { useCatalogStore } from '@/stores/catalog'
import { useDiscountStore } from '@/stores/discount'
import { useOrderStore } from '@/stores/order'
import { useAuthorityManagementStore } from '@/stores/authorityManagement'
import { useRolesStore } from '@/stores/roles'
import { fetchCatalog, toLocalCategories, toLocalModifierGroups, toLocalProducts } from '@/api/catalog'
import { fetchPromotions, toOrderCoupons, toQuickDiscounts } from '@/api/promotions'
import { fetchPaymentMethods } from '@/api/payment-methods'
import { fetchTenantSettings } from '@/api/tenant-settings'
import { fetchStaffList } from '@/api/staff'
import { fetchRoleList } from '@/api/roles'
import { toStaffMember } from '@/api/auth'
import { useOrderSync } from '@/offline/useOrderSync'
// 根元件匯入以提早套用深色模式 class，避免主題閃爍。
import { useTheme } from '@/composables/useTheme'
useTheme()

// 應用啟動時一次性同步菜單目錄（離線或失敗時保留本機資料）。
const catalogStore = useCatalogStore()
const { data: catalog } = useQuery({
  queryKey: ['catalog'],
  queryFn: fetchCatalog,
  staleTime: Infinity,
  retry: 1
})
watch(catalog, (value) => {
  if (!value) return
  catalogStore.hydrateCatalogFromServer({
    categories: toLocalCategories(value),
    products: toLocalProducts(value),
    modifierGroups: toLocalModifierGroups(value)
  })
})

// 應用啟動時一次性同步促銷資料。
const discountStore = useDiscountStore()
const { data: promotions } = useQuery({
  queryKey: ['promotions'],
  queryFn: fetchPromotions,
  staleTime: Infinity,
  retry: 1
})
watch(promotions, (value) => {
  if (!value) return
  discountStore.hydratePromotionsFromServer({
    orderCoupons: toOrderCoupons(value),
    quickDiscounts: toQuickDiscounts(value)
  })
})

// 應用啟動時一次性同步付款方式清單。
const orderStore = useOrderStore()
const { data: paymentMethods } = useQuery({
  queryKey: ['payment-methods'],
  queryFn: fetchPaymentMethods,
  staleTime: Infinity,
  retry: 1
})
watch(paymentMethods, (value) => {
  if (!value) return
  orderStore.hydratePaymentMethodsFromServer(value)
})

// 應用啟動時一次性同步租戶營業設定（目前只有營業日換日時間）。
const { data: tenantSettings } = useQuery({
  queryKey: ['tenant-settings'],
  queryFn: fetchTenantSettings,
  staleTime: Infinity,
  retry: 1
})
watch(tenantSettings, (value) => {
  if (!value) return
  orderStore.hydrateBusinessDayStartHourFromServer(value.businessDayStartHour)
})

// 應用啟動時一次性同步人員名單。
const authorityManagementStore = useAuthorityManagementStore()
const { data: staffListResponse } = useQuery({
  queryKey: ['staff'],
  queryFn: fetchStaffList,
  staleTime: Infinity,
  retry: 1
})
watch(staffListResponse, (value) => {
  if (!value) return
  authorityManagementStore.hydrateStaffFromServer(value.map(toStaffMember))
})

// 應用啟動時一次性同步權限群組（角色）清單。
const rolesStore = useRolesStore()
const { data: roleListResponse } = useQuery({
  queryKey: ['roles'],
  queryFn: fetchRoleList,
  staleTime: Infinity,
  retry: 1
})
watch(roleListResponse, (value) => {
  if (!value) return
  rolesStore.hydrateRolesFromServer(value)
})

// 根元件常駐啟動離線送單背景同步 worker。
const orderSync = useOrderSync()
onMounted(() => {
  orderSync.start()
})
onUnmounted(() => {
  orderSync.stop()
})
</script>

<style scoped></style>
