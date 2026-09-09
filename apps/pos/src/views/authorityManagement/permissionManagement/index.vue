<template>
  <div class="w-full flex flex-col min-h-[640px]">
    <div class="p-5 flex flex-col justify-between overflow-hidden">
      <div>
        <div class="flex items-center justify-between pb-3.5 border-b border-surface-200 dark:border-surface-800">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400 border border-primary-200/50 dark:border-primary-800/40">
              <UserCheck class="h-4 w-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-tight">人員名單</h3>
              <p class="text-[11px] text-surface-400">門市各崗位人員與角色權限範本</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-3 py-1.5 text-xs font-bold"
              :class="{ 'opacity-40 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetAuthority') }"
              @click="openAddStaffDialog">新增</button>
            <button
              type="button"
              class="pos-btn pos-btn-danger px-3 py-1.5 text-xs font-bold"
              :class="{ 'opacity-40 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetAuthority') }"
              @click="deleteStaff">刪除</button>
            <button
              type="button"
              class="pos-btn pos-btn-primary px-3 py-1.5 text-xs font-bold"
              :class="{ 'opacity-40 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetAuthority') }"
              @click="openEditStaffDialog">編輯</button>
          </div>
        </div>

        <div class="mt-4 overflow-hidden rounded-xl border border-surface-200 dark:border-surface-800">
          <table class="w-full text-center text-xs">
            <thead class="bg-surface-50 dark:bg-surface-800/80 font-bold text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th class="px-3 py-2.5 text-left">人員名稱</th>
                <th class="px-3 py-2.5">帳號</th>
                <th class="px-3 py-2.5">職稱</th>
                <th class="px-3 py-2.5">權限</th>
                <th class="px-3 py-2.5">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="sliceStaffList.length === 0">
                <td colspan="5" class="px-3 py-8 text-surface-400 dark:text-surface-500">人員名單是空的</td>
              </tr>
              <tr
                v-for="row in sliceStaffList" :key="row.id"
                class="cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-950"
                :class="{ 'bg-primary-50/90 dark:bg-primary-950/40 font-bold': currentStaff.id === row.id }"
                @click="currentStaff = row">
                <td class="px-3 py-2.5 text-left font-bold text-surface-900 dark:text-surface-100">{{ row.name }}</td>
                <td class="px-3 py-2.5 font-mono text-surface-500">{{ row.account }}</td>
                <td class="px-3 py-2.5">
                  <span
                    class="rounded-lg px-2 py-0.5 text-[11px] font-bold"
                    :class="row.jobTitle === '店長' ? 'bg-accent-50 text-accent-600 dark:bg-accent-950/50 dark:text-accent-400 border border-accent-200 dark:border-accent-800' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'">
                    {{ row.jobTitle }}
                  </span>
                </td>
                <td class="px-3 py-2.5">
                  <span class="inline-flex items-center gap-1.5">
                    <span
                      class="rounded-full px-2 py-0.5 text-[11px] font-bold"
                      :class="staffRoleBadgeClass(row.authorityCheckList)">
                      {{ deriveStaffRole(row.authorityCheckList) }}
                    </span>
                    <span class="text-[10px] font-mono text-surface-400">{{ row.authorityCheckList.length }}/{{ authorityFields.length }} 項</span>
                  </span>
                </td>
                <td class="px-3 py-2.5">
                  <button
                    type="button" aria-label="編輯人員"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 hover:text-primary-600 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-primary-400"
                    :class="{ 'opacity-40 pointer-events-none': !hasCapability(loginStore.userInfo, 'canSetAuthority') }"
                    @click.stop="currentStaff = row; openEditStaffDialog()">
                    <Pencil class="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300">
        <p>{{ `共 ${authorityManagementStore.staffList.length} 樣` }}</p>
        <AppPagination :page="staffCurrentPage" :page-count="staffPageCount" :total="authorityManagementStore.staffList.length" @update:page="handleStaffCurrentChange" />
      </div>
    </div>

  </div>

  <ModalDialog v-model:open="addStaffDialog" title="新增人員" size="lg">
    <div class="space-y-3.5 py-1">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">人員的名稱</label>
          <input
            v-model="currentInputStaffName"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="例如: Jensen、Jacky..." />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">人員的職稱</label>
          <input
            v-model="currentInputStaffJobTitle"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="例如: 襄理、工讀生..." />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">人員的帳號</label>
          <input
            v-model="currentInputStaffAccount"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="請輸入帳號" />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">登入用PIN</label>
          <input
            v-model="currentInputStaffPin" type="password" inputmode="numeric" maxlength="6"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="4~6碼數字" />
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-bold text-surface-700 dark:text-surface-300">權限管理</label>
        <AuthorityChecklist v-model="authorityCheckList" />
      </div>
    </div>
    <div class="mt-5 flex justify-end gap-2.5">
      <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="closeAddStaffDialog">取消</button>
      <button type="button" class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold" @click="addStaff">新增</button>
    </div>
  </ModalDialog>

  <ModalDialog v-model:open="editStaffDialog" title="編輯人員" size="lg">
    <div class="space-y-3.5 py-1">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">人員的名稱</label>
          <input
            v-model="currentEditInputStaffName"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="例如: Jensen、Jacky..." />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">人員的職稱</label>
          <input
            v-model="currentEditInputStaffJobTitle"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="例如: 襄理、工讀生..." />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">人員的帳號</label>
          <input
            v-model="currentEditInputStaffAccount"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="請輸入帳號" />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1">登入用PIN</label>
          <input
            v-model="currentEditInputStaffPin" type="password" inputmode="numeric" maxlength="6"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="留空則不變更" />
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-bold text-surface-700 dark:text-surface-300">權限管理</label>
        <AuthorityChecklist v-model="editAuthorityCheckList" />
      </div>
    </div>
    <div class="mt-5 flex justify-end gap-2.5">
      <button type="button" class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold" @click="closeEditStaffDialog">取消</button>
      <button type="button" class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold" @click="editStaff">保存</button>
    </div>
  </ModalDialog>

</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UserCheck, Pencil } from 'lucide-vue-next'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AuthorityChecklist from '@/components/ui/AuthorityChecklist.vue'
import { AUTHORITY_FIELDS as authorityFields, deriveStaffRole, CUSTOM_ROLE_LABEL } from '@/utils/authority'
import { alert, confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { useAuthorityManagementStore } from '@/stores/authorityManagement'
const authorityManagementStore = useAuthorityManagementStore()
import { useLoginStore } from '@/stores/login';
const loginStore = useLoginStore()
import type { AuthorityKey, MaybeSelected, StaffMember } from '@/types'
import { fromSelection, hasCapability } from '@/utils/selection'
import { ApiError } from '@/api/http'
import { toStaffMember } from '@/api/auth'
import {
  createStaff as createStaffApi,
  deleteStaff as deleteStaffApi,
  updateStaff as updateStaffApi,
} from '@/api/staff'

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return '操作失敗：帳號或名稱已被使用'
    return `操作失敗：${err.message}`
  }
  return '連不上伺服端，請確認網路連線'
}
const PIN_PATTERN = /^\d{4,6}$/

// 人員與付款方式由 App.vue 啟動時同步，CRUD 直接以 API 回應更新本機陣列，避免重複 fetch 覆蓋。

const currentStaff = ref<MaybeSelected<StaffMember>>({})
const addStaffDialog = ref(false)
const openAddStaffDialog = () => {
  currentInputStaffName.value = ''
  currentInputStaffJobTitle.value = ''
  currentInputStaffAccount.value = ''
  currentInputStaffPin.value = ''
  authorityCheckList.value = []
  addStaffDialog.value = true
}
const closeAddStaffDialog = () => {
  addStaffDialog.value = false
  showToast('操作取消', 'error')
}
const currentInputStaffName = ref('')
const currentInputStaffJobTitle = ref('')
const currentInputStaffAccount = ref('')
const currentInputStaffPin = ref('')
const authorityCheckList = ref<AuthorityKey[]>([])
const editAuthorityCheckList = ref<AuthorityKey[]>([])

// 權限定義與角色範本收斂在 utils/authority.ts，供人員表格摘要與 AuthorityChecklist 共用。

function staffRoleBadgeClass(authorityCheckList: AuthorityKey[]): string {
  const role = deriveStaffRole(authorityCheckList)
  if (role === CUSTOM_ROLE_LABEL) return 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'
  if (role === '店長') return 'bg-accent-50 text-accent-600 dark:bg-accent-950/50 dark:text-accent-400'
  return 'bg-info-50 text-info-600 dark:bg-info-950/50 dark:text-info-400'
}

const addStaff = async () => {
  if (currentInputStaffName.value == '' || currentInputStaffJobTitle.value == '' || currentInputStaffAccount.value == '' || currentInputStaffPin.value == '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (!PIN_PATTERN.test(currentInputStaffPin.value)) {
    showToast('PIN 必須是 4 到 6 碼數字,請重新輸入', 'error')
    return
  }
  if (authorityManagementStore.staffList.find((item) => item.account == currentInputStaffAccount.value)) {
    showToast('此帳號已存在,請重新輸入', 'error')
    return
  }
  try {
    const created = await createStaffApi({
      name: currentInputStaffName.value,
      jobTitle: currentInputStaffJobTitle.value,
      account: currentInputStaffAccount.value,
      capabilities: authorityCheckList.value,
      pin: currentInputStaffPin.value,
    })
    // 陣列重建以觸發 reactive 更新，並標記本機已異動以防背景同步覆蓋。
    authorityManagementStore.staffList = [...authorityManagementStore.staffList, toStaffMember(created)]
    authorityManagementStore.staffSource = 'server'
    showToast('新增人員成功', 'success')
    addStaffDialog.value = false
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
const deleteStaff = async () => {
  if (currentStaff.value.jobTitle === '店長') {
    showToast('不可刪除店長', 'error')
    return
  }
  if (currentStaff.value.account === fromSelection(loginStore.userInfo)?.account) {
    showToast('不可刪除自己', 'error')
    return
  }
  if (!currentStaff.value.name) {
    void alert({ title: '通知', description: '請先選擇要刪除的人員', confirmText: '繼續選擇' })
    return
  }
  const result = await confirm({ title: '警告', description: `是否刪除人員 ${currentStaff.value.name} ?` })
  if (result !== 'confirm') return
  try {
    await deleteStaffApi(String(currentStaff.value.id))
    authorityManagementStore.staffList = authorityManagementStore.staffList.filter((item) => item.id !== currentStaff.value.id)
    authorityManagementStore.staffSource = 'server'
    currentStaff.value = {}
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
const editStaffDialog = ref(false)
const currentEditInputStaffName = ref('')
const currentEditInputStaffJobTitle = ref('')
const currentEditInputStaffAccount = ref('')
const currentEditInputStaffPin = ref('')
const openEditStaffDialog = () => {
  if (currentStaff.value.jobTitle === '店長') {
    showToast('不可編輯店長', 'error')
    return
  }
  if (currentStaff.value.account === fromSelection(loginStore.userInfo)?.account) {
    showToast('不可編輯自己', 'error')
    return
  }
  if (currentStaff.value.name) {
    currentEditInputStaffName.value = currentStaff.value.name
    currentEditInputStaffJobTitle.value = currentStaff.value.jobTitle!
    currentEditInputStaffAccount.value = currentStaff.value.account!
    currentEditInputStaffPin.value = ''
    editAuthorityCheckList.value = currentStaff.value.authorityCheckList!
    editStaffDialog.value = true
  } else {
    void alert({ title: '通知', description: '請先選擇要編輯的人員', confirmText: '繼續選擇' })
  }
}
const closeEditStaffDialog = () => {
  editStaffDialog.value = false
  showToast('操作取消', 'error')
}
const editStaff = async () => {
  if (currentEditInputStaffName.value == '' || currentEditInputStaffJobTitle.value == '' || currentEditInputStaffAccount.value == '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (currentEditInputStaffPin.value !== '' && !PIN_PATTERN.test(currentEditInputStaffPin.value)) {
    showToast('PIN 必須是 4 到 6 碼數字,請重新輸入', 'error')
    return
  }
  const authorityUnchanged = editAuthorityCheckList.value.length === currentStaff.value.authorityCheckList!.length
    && editAuthorityCheckList.value.every((key) => currentStaff.value.authorityCheckList!.includes(key))
  if (currentEditInputStaffName.value == currentStaff.value.name && currentEditInputStaffJobTitle.value == currentStaff.value.jobTitle && currentEditInputStaffAccount.value == currentStaff.value.account && currentEditInputStaffPin.value === '' && authorityUnchanged) {
    editStaffDialog.value = false
    showToast('保存成功', 'success')
    return
  }
  const anotherAccount = authorityManagementStore.staffList.filter(item => item.id != currentStaff.value.id)
  if (anotherAccount.some(item => item.account == currentEditInputStaffAccount.value)) {
    showToast('此帳號已存在,請重新輸入', 'error')
    return
  }
  try {
    const updated = await updateStaffApi(String(currentStaff.value.id), {
      name: currentEditInputStaffName.value,
      jobTitle: currentEditInputStaffJobTitle.value,
      account: currentEditInputStaffAccount.value,
      capabilities: editAuthorityCheckList.value,
      ...(currentEditInputStaffPin.value !== '' ? { pin: currentEditInputStaffPin.value } : {}),
    })
    const mapped = toStaffMember(updated)
    currentStaff.value.name = mapped.name
    currentStaff.value.jobTitle = mapped.jobTitle
    currentStaff.value.account = mapped.account
    currentStaff.value.authorityCheckList = mapped.authorityCheckList
    authorityManagementStore.staffSource = 'server'
    editStaffDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
const staffCurrentPage = ref(1)
const handleStaffCurrentChange = (page: number) => {
  staffCurrentPage.value = page
}
const sliceStaffList = computed(() => {
  return authorityManagementStore.staffList.slice((staffCurrentPage.value - 1) * 10, staffCurrentPage.value * 10)
})
const staffPageCount = computed(() => Math.max(Math.ceil(authorityManagementStore.staffList.length / 10), 1))
</script>

<style lang="scss" scoped></style>
