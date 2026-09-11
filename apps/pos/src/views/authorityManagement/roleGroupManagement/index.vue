<template>
  <div class="w-full flex flex-col p-4">
    <div class="flex items-center justify-between pb-3 mb-3 border-b border-surface-100 dark:border-surface-800">
      <span class="text-sm font-black text-surface-900 dark:text-surface-100">
        權限群組<span class="ml-2 rounded-full bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-[10px] font-bold text-surface-600 dark:text-surface-300">共 {{ rolesStore.roleList.length }} 組</span>
      </span>
      <button
        type="button" class="pos-btn pos-btn-primary px-3 py-1.5 text-xs"
        :class="{ 'opacity-50 pointer-events-none': !canManage }"
        @click="openAddDialog">＋ 新增權限群組</button>
    </div>

    <div class="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-800">
      <table class="w-full text-center text-sm">
        <thead class="bg-surface-100 dark:bg-surface-800 text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400">
          <tr>
            <th class="px-3 py-2.5 text-left">名稱</th>
            <th class="px-3 py-2.5">類型</th>
            <th class="px-3 py-2.5">權限內容</th>
            <th class="px-3 py-2.5">使用人數</th>
            <th class="px-3 py-2.5">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
          <tr v-if="sliceRoleList.length === 0">
            <td colspan="5" class="px-3 py-8 text-surface-400 dark:text-surface-500">還沒有任何權限群組</td>
          </tr>
          <tr v-for="row in sliceRoleList" :key="row.id" class="hover:bg-surface-50 dark:hover:bg-surface-950/40">
            <td class="px-3 py-2.5 text-left font-bold text-surface-900 dark:text-surface-100">{{ row.name }}</td>
            <td class="px-3 py-2.5">
              <span
                class="rounded-full px-2 py-0.5 text-[11px] font-bold"
                :class="row.isSystem ? 'bg-accent-50 text-accent-600 dark:bg-accent-950/50 dark:text-accent-400 border border-accent-200 dark:border-accent-800' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'">
                {{ row.isSystem ? '系統內建' : '自訂' }}
              </span>
            </td>
            <td class="px-3 py-2.5">
              <span class="rounded-md bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-[11px] font-mono font-medium text-surface-600 dark:text-surface-300">
                {{ row.capabilities.length }}/{{ AUTHORITY_FIELDS.length }} 項
              </span>
            </td>
            <td class="px-3 py-2.5 font-mono text-surface-500">{{ staffCountOf(row.id) }} 人</td>
            <td class="px-3 py-2.5">
              <div class="flex items-center justify-center gap-1.5">
                <button
                  type="button" class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
                  :class="{ 'opacity-50 pointer-events-none': !canManage }"
                  @click="openEditDialog(row)">編輯</button>
                <button
                  type="button" class="pos-btn pos-btn-danger px-2.5 py-1 text-xs"
                  :class="{ 'opacity-50 pointer-events-none': !canManage }"
                  @click="removeRole(row)">刪除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300">
      <p>{{ `共 ${rolesStore.roleList.length} 組` }}</p>
      <AppPagination :page="roleCurrentPage" :page-count="rolePageCount" :total="rolesStore.roleList.length" @update:page="handleRoleCurrentChange" />
    </div>

    <ModalDialog v-model:open="dialog.open" :title="dialog.editingId ? '編輯權限群組' : '新增權限群組'" size="lg">
      <div class="space-y-3.5 py-1">
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">權限群組名稱</label>
          <input
            v-model="dialog.name"
            :disabled="dialog.isSystem"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-60"
            placeholder="例如: 外場、吧台..." />
          <p v-if="dialog.isSystem" class="mt-1 text-[11px] text-surface-400">系統內建角色不可改名，但權限內容仍可調整。</p>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-bold text-surface-700 dark:text-surface-300">權限內容</label>
          <AuthorityChecklist v-model="dialog.capabilities" />
        </div>
      </div>
      <div class="mt-5 flex justify-end gap-2.5">
        <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="dialog.open = false">取消</button>
        <button type="button" class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold" @click="submit">{{ dialog.editingId ? '保存' : '新增' }}</button>
      </div>
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { Role } from '@pos/contract'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AuthorityChecklist from '@/components/ui/AuthorityChecklist.vue'
import { AUTHORITY_FIELDS } from '@/utils/authority'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { useRolesStore } from '@/stores/roles'
const rolesStore = useRolesStore()
import { useAuthorityManagementStore } from '@/stores/authorityManagement'
const authorityManagementStore = useAuthorityManagementStore()
import { useLoginStore } from '@/stores/login'
const loginStore = useLoginStore()
import type { AuthorityKey } from '@/types'
import { hasCapability } from '@/utils/selection'
import { ApiError } from '@/api/http'
import { createRole, deleteRole, updateRole } from '@/api/roles'

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return `操作失敗：${err.message}`
  return '連不上伺服端，請確認網路連線'
}

const canManage = computed(() => hasCapability(loginStore.userInfo, 'canManageRoles'))

function staffCountOf(roleId: string): number {
  return authorityManagementStore.staffList.filter((staff) => staff.roleId === roleId).length
}

const roleCurrentPage = ref(1)
function handleRoleCurrentChange(page: number) {
  roleCurrentPage.value = page
}
const sliceRoleList = computed(() => {
  return rolesStore.roleList.slice((roleCurrentPage.value - 1) * 10, roleCurrentPage.value * 10)
})
const rolePageCount = computed(() => Math.max(Math.ceil(rolesStore.roleList.length / 10), 1))

const dialog = reactive<{ open: boolean; editingId: string | null; isSystem: boolean; name: string; capabilities: AuthorityKey[] }>({
  open: false, editingId: null, isSystem: false, name: '', capabilities: [],
})
function openAddDialog() {
  if (!canManage.value) return
  dialog.editingId = null
  dialog.isSystem = false
  dialog.name = ''
  dialog.capabilities = []
  dialog.open = true
}
function openEditDialog(row: Role) {
  if (!canManage.value) return
  dialog.editingId = row.id
  dialog.isSystem = row.isSystem
  dialog.name = row.name
  dialog.capabilities = [...row.capabilities]
  dialog.open = true
}
async function submit() {
  if (dialog.name.trim() === '') {
    showToast('請輸入權限群組名稱', 'error')
    return
  }
  if (rolesStore.roleList.some((item) => item.name === dialog.name && item.id !== dialog.editingId)) {
    showToast('此名稱已存在,請重新輸入', 'error')
    return
  }
  const payload = { name: dialog.name, capabilities: dialog.capabilities }
  try {
    if (dialog.editingId === null) {
      const created = await createRole(payload)
      rolesStore.roleList = [...rolesStore.roleList, created]
      showToast('新增權限群組成功', 'success')
    } else {
      const updated = await updateRole(dialog.editingId, payload)
      const index = rolesStore.roleList.findIndex((item) => item.id === dialog.editingId)
      if (index !== -1) rolesStore.roleList[index] = updated
      // 角色權限異動即時反映到人員名單的 authorityCheckList（單一權限來源，見 db/schema.ts 說明）。
      authorityManagementStore.staffList = authorityManagementStore.staffList.map((staff) =>
        staff.roleId === updated.id ? { ...staff, roleName: updated.name, authorityCheckList: updated.capabilities } : staff,
      )
      showToast('保存成功', 'success')
    }
    dialog.open = false
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
async function removeRole(row: Role) {
  if (!canManage.value) return
  if (row.isSystem) {
    showToast('系統內建角色不可刪除', 'error')
    return
  }
  if (staffCountOf(row.id) > 0) {
    showToast('仍有員工使用此角色，請先改指到其他角色', 'error')
    return
  }
  const result = await confirm({ title: '警告', description: `是否刪除權限群組 ${row.name}？`, variant: 'danger' })
  if (result !== 'confirm') return
  try {
    await deleteRole(row.id)
    rolesStore.roleList = rolesStore.roleList.filter((item) => item.id !== row.id)
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
</script>

<style lang="scss" scoped></style>
