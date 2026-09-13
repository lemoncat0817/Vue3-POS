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
import { useDeviceStore } from '@/stores/device'
import { fetchCatalog, toLocalCategories, toLocalModifierGroups, toLocalProducts } from '@/api/catalog'
import { fetchPromotions, toOrderCoupons, toQuickDiscounts } from '@/api/promotions'
import { fetchPaymentMethods } from '@/api/payment-methods'
import { fetchTenantSettings } from '@/api/tenant-settings'
import { fetchCurrentDevice } from '@/api/devices'
import { fetchStaffList } from '@/api/staff'
import { fetchRoleList } from '@/api/roles'
import { toStaffMember } from '@/api/auth'
import { useOrderSync } from '@/offline/useOrderSync'
// 根元件匯入以提早套用深色模式 class，避免主題閃爍。
import { useTheme } from '@/composables/useTheme'
useTheme()

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

const { data: tenantSettings } = useQuery({
  queryKey: ['tenant-settings'],
  queryFn: fetchTenantSettings,
  staleTime: Infinity,
  retry: 1
})
watch(tenantSettings, (value) => {
  if (!value) return
  orderStore.hydrateBusinessDayStartHourFromServer(value.businessDayStartHour)
  orderStore.hydratePointsRedemptionRateFromServer(value.pointsRedemptionRate)
  orderStore.hydratePointsPerCurrencyUnitFromServer(value.pointsPerCurrencyUnit)
})

const deviceStore = useDeviceStore()
const { data: currentDevice } = useQuery({
  queryKey: ['current-device'],
  queryFn: fetchCurrentDevice,
  staleTime: Infinity,
  retry: 1
})
watch(currentDevice, (value) => {
  if (!value) return
  deviceStore.hydrateDeviceNameFromServer(value.name)
})

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

const orderSync = useOrderSync()
onMounted(() => {
  orderSync.start()
})
onUnmounted(() => {
  orderSync.stop()
})
</script>

<style scoped></style>
