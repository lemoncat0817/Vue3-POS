<template>
  <div class="w-full flex flex-col items-center bg-surface-50/50 dark:bg-surface-950 px-4 py-6">
    <div class="w-full max-w-7xl flex flex-col gap-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 shadow-sm">
        <div>
          <h1 class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-100 tracking-tight">會員管理</h1>
          <p class="mt-1 text-xs lg:text-sm text-surface-500 dark:text-surface-400">
            查詢顧客消費歷程、管理會員集點與維護顧客資料庫
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs lg:text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95 shadow-md shadow-primary-600/25 select-none"
            :class="{ 'pointer-events-none opacity-40': !canManage }"
            @click="openAddDialog">
            <UserPlus class="h-4 w-4" />
            <span>新增會員</span>
          </button>
        </div>
      </div>

      <div class="w-full rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm p-4 overflow-hidden">
        <div class="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800">
          <div class="text-sm font-black text-surface-800 dark:text-surface-200">會員名單</div>
          <span class="text-xs font-bold text-surface-500">共 {{ members.length }} 位會員</span>
        </div>

      <table class="mt-4 w-full text-center text-sm">
        <thead class="bg-surface-100 text-xs font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
          <tr>
            <th class="px-2 py-2">序號</th>
            <th class="px-2 py-2">姓名</th>
            <th class="px-2 py-2">手機</th>
            <th class="px-2 py-2">點數</th>
            <th class="px-2 py-2">加入時間</th>
            <th class="px-2 py-2">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
          <tr v-if="members.length === 0">
            <td colspan="6" class="px-2 py-8 text-surface-400 dark:text-surface-500">還沒有任何會員</td>
          </tr>
          <tr
            v-for="(member, index) in members" :key="member.id"
            class="transition-colors hover:bg-surface-50 dark:hover:bg-surface-950">
            <td class="px-2 py-2">{{ index + 1 }}</td>
            <td class="px-2 py-2">{{ member.name }}</td>
            <td class="px-2 py-2">{{ member.phone }}</td>
            <td class="px-2 py-2 font-bold text-primary-600 dark:text-primary-400">{{ member.points }}</td>
            <td class="px-2 py-2">{{ member.createdAt.slice(0, 10) }}</td>
            <td class="px-2 py-2">
              <div class="flex justify-center gap-2">
                <button
                  type="button"
                  class="rounded-lg border border-surface-300 px-2 py-1 text-xs font-bold text-surface-700 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
                  @click="openDetail(member)">消費紀錄</button>
                <button
                  type="button"
                  class="rounded-lg border border-surface-300 px-2 py-1 text-xs font-bold text-surface-700 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
                  :class="{ 'pointer-events-none opacity-40': !canManage }"
                  @click="openEditDialog(member)">編輯</button>
                <button
                  type="button"
                  class="rounded-lg border border-danger-200 px-2 py-1 text-xs font-bold text-danger-600 transition-colors hover:bg-danger-50 dark:border-danger-800 dark:text-danger-400 dark:hover:bg-danger-950"
                  :class="{ 'pointer-events-none opacity-40': !canManage }"
                  @click="deleteMemberRow(member)">刪除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModalDialog v-model:open="addDialog" title="新增會員">
      <Form v-slot="{ isSubmitting }" :validation-schema="toTypedSchema(memberSchema())" :initial-values="{ name: '', phone: '' }" @submit="onSubmitAdd">
        <FormField name="name" label="姓名" :disabled="isSubmitting" placeholder="例如: 王小明" />
        <FormField name="phone" label="手機號碼" :disabled="isSubmitting" placeholder="例如: 0912345678" />
        <div class="mt-2 flex justify-end gap-2">
          <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="addDialog = false">取消</button>
          <button type="submit" :disabled="isSubmitting" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">新增</button>
        </div>
      </Form>
    </ModalDialog>

    <ModalDialog v-model:open="editDialog" title="編輯會員">
      <Form
        v-slot="{ isSubmitting }"
        :validation-schema="toTypedSchema(memberSchema(currentMember?.id))"
        :initial-values="{ name: currentMember?.name ?? '', phone: currentMember?.phone ?? '' }"
        @submit="onSubmitEdit">
        <FormField name="name" label="姓名" :disabled="isSubmitting" placeholder="例如: 王小明" />
        <FormField name="phone" label="手機號碼" :disabled="isSubmitting" placeholder="例如: 0912345678" />
        <div class="mt-2 flex justify-end gap-2">
          <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="editDialog = false">取消</button>
          <button type="submit" :disabled="isSubmitting" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">保存</button>
        </div>
      </Form>
    </ModalDialog>

    <ModalDialog v-model:open="detailDialog" :title="`${detail?.name ?? ''} 的消費紀錄`">
      <p class="text-sm text-surface-600 dark:text-surface-400">目前累積點數：<span class="font-bold text-primary-600 dark:text-primary-400">{{ detail?.points ?? 0 }}</span></p>
      <table class="mt-3 w-full text-center text-sm">
        <thead class="bg-surface-100 text-xs font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
          <tr>
            <th class="px-2 py-2">訂單編號</th>
            <th class="px-2 py-2">時間</th>
            <th class="px-2 py-2">狀態</th>
            <th class="px-2 py-2">金額</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
          <tr v-if="!detail || detail.orders.length === 0">
            <td colspan="4" class="px-2 py-6 text-surface-400 dark:text-surface-500">還沒有消費紀錄</td>
          </tr>
          <tr v-for="order in detail?.orders ?? []" :key="order.orderId">
            <td class="px-2 py-2">{{ order.orderId }}</td>
            <td class="px-2 py-2">{{ order.orderTime }}</td>
            <td class="px-2 py-2">{{ order.orderStatus }}</td>
            <td class="px-2 py-2">{{ order.orderPaymentPrice }} 元</td>
          </tr>
        </tbody>
      </table>
    </ModalDialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserPlus } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Form } from 'vee-validate'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import { useLoginStore } from '@/stores/login'
import { hasCapability } from '@/utils/selection'
import { ApiError } from '@/api/http'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import {
  createMember,
  deleteMember,
  fetchMemberDetail,
  fetchMembers,
  updateMember,
} from '@/api/members'
import type { Member, MemberDetail } from '@pos/contract'

const loginStore = useLoginStore()
const canManage = () => hasCapability(loginStore.userInfo, 'canCheckMembers')

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return '這個手機號碼已經是會員'
    return `操作失敗：${err.message}`
  }
  return '連不上伺服端，請確認網路連線'
}

// 會員名單為後台管理專用資料，無需離線可用，掛載時直接向伺服端獲取最新清單。
const members = ref<Member[]>([])
onMounted(async () => {
  try {
    members.value = await fetchMembers()
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
})

function memberSchema(excludeId?: string) {
  return z.object({
    name: z.string().trim().min(1, '請輸入姓名'),
    phone: z.string().trim().min(1, '請輸入手機號碼').refine(
      (phone) => !members.value.some((item) => item.phone === phone && item.id !== excludeId),
      '這個手機號碼已經是會員',
    ),
  })
}

const addDialog = ref(false)
function openAddDialog() {
  if (!canManage()) return
  addDialog.value = true
}
async function onSubmitAdd(values: Record<string, unknown>) {
  const input = values as { name: string; phone: string }
  try {
    const created = await createMember(input)
    members.value.push(created)
    addDialog.value = false
    showToast('新增成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

const editDialog = ref(false)
const currentMember = ref<Member | null>(null)
function openEditDialog(member: Member) {
  if (!canManage()) return
  currentMember.value = member
  editDialog.value = true
}
async function onSubmitEdit(values: Record<string, unknown>) {
  if (!currentMember.value) return
  const input = values as { name: string; phone: string }
  try {
    const updated = await updateMember(currentMember.value.id, input)
    const target = members.value.find((item) => item.id === updated.id)
    if (target) {
      target.name = updated.name
      target.phone = updated.phone
    }
    editDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

async function deleteMemberRow(member: Member) {
  if (!canManage()) return
  const result = await confirm({ title: '警告', description: `是否刪除會員 ${member.name}？`, variant: 'danger' })
  if (result !== 'confirm') return
  try {
    await deleteMember(member.id)
    members.value = members.value.filter((item) => item.id !== member.id)
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

const detailDialog = ref(false)
const detail = ref<MemberDetail | null>(null)
async function openDetail(member: Member) {
  try {
    detail.value = await fetchMemberDetail(member.id)
    detailDialog.value = true
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
</script>

<style scoped></style>
