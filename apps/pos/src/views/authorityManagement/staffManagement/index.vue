<template>
  <div class="w-full flex flex-col p-4">
    <div
      class="flex items-center justify-between pb-3 mb-3 border-b border-surface-100 dark:border-surface-800"
    >
      <span class="text-sm font-black text-surface-900 dark:text-surface-100">人員名單</span>
      <button
        type="button"
        class="pos-btn pos-btn-primary px-3 py-1.5 text-xs"
        :class="{ 'opacity-50 pointer-events-none': !canManage }"
        @click="openAddStaffDialog"
      >
        ＋ 新增人員
      </button>
    </div>

    <div
      class="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead
            class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
          >
            <tr>
              <th class="px-4 py-3.5 text-left">人員名稱</th>
              <th class="px-4 py-3.5 text-left">帳號</th>
              <th class="px-4 py-3.5 text-left">職稱</th>
              <th class="px-4 py-3.5 text-center">權限群組</th>
              <th class="px-4 py-3.5 text-center">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
            <tr v-if="sliceStaffList.length === 0">
              <td colspan="5" class="px-4 py-16 text-center text-surface-400 dark:text-surface-500">
                <div class="flex flex-col items-center justify-center gap-2">
                  <Users class="h-10 w-10 text-surface-300 dark:text-surface-700" />
                  <span class="text-base font-semibold text-surface-700 dark:text-surface-300"
                    >人員名單是空的</span
                  >
                  <span class="text-xs text-surface-400 dark:text-surface-500"
                    >尚未建立人員資料，可點選上方「＋ 新增人員」</span
                  >
                </div>
              </td>
            </tr>
            <tr
              v-for="row in sliceStaffList"
              :key="row.id"
              class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
            >
              <td
                class="px-4 py-3.5 align-middle text-left font-bold text-surface-900 dark:text-surface-100"
              >
                {{ row.name }}
              </td>
              <td class="px-4 py-3.5 align-middle text-left font-mono text-surface-500">
                {{ row.account }}
              </td>
              <td class="px-4 py-3.5 align-middle text-left text-surface-700 dark:text-surface-300">
                {{ row.jobTitle }}
              </td>
              <td class="px-4 py-3.5 align-middle text-center">
                <span
                  class="inline-flex items-center rounded-full bg-info-50 px-2.5 py-0.5 text-[11px] font-bold text-info-600 dark:bg-info-950/50 dark:text-info-400"
                >
                  {{ row.roleName }}
                </span>
              </td>
              <td class="px-4 py-3.5 align-middle text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
                    :class="{ 'opacity-50 pointer-events-none': !canEdit(row) }"
                    @click="openEditStaffDialog(row)"
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    class="pos-btn pos-btn-danger px-2.5 py-1 text-xs"
                    :class="{ 'opacity-50 pointer-events-none': !canEdit(row) }"
                    @click="deleteStaff(row)"
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <TablePagination
        :page="staffCurrentPage"
        :page-count="staffPageCount"
        :total="authorityManagementStore.staffList.length"
        :current-count="sliceStaffList.length"
        unit="位人員"
        @update:page="handleStaffCurrentChange"
      />
    </div>

    <ModalDialog v-model:open="addStaffDialog" title="新增人員" size="lg">
      <div class="space-y-3.5 py-1">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
              >人員的名稱</label
            >
            <input
              v-model="currentInputStaffName"
              class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="例如: Jensen、Jacky..."
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
              >人員的職稱</label
            >
            <input
              v-model="currentInputStaffJobTitle"
              class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="例如: 襄理、工讀生..."
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
              >人員的帳號</label
            >
            <input
              v-model="currentInputStaffAccount"
              class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="請輸入帳號"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
              >登入用PIN</label
            >
            <input
              v-model="currentInputStaffPin"
              type="password"
              inputmode="numeric"
              maxlength="6"
              class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="4~6碼數字"
            />
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-bold text-surface-700 dark:text-surface-300"
            >權限群組</label
          >
          <RoleSelect v-model="currentInputRoleId" />
        </div>
      </div>
      <div class="mt-5 flex justify-end gap-2.5">
        <button
          type="button"
          class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold"
          @click="closeAddStaffDialog"
        >
          取消
        </button>
        <button
          type="button"
          class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold"
          @click="addStaff"
        >
          新增
        </button>
      </div>
    </ModalDialog>

    <ModalDialog v-model:open="editStaffDialog" title="編輯人員" size="lg">
      <div class="space-y-3.5 py-1">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
              >人員的名稱</label
            >
            <input
              v-model="currentEditInputStaffName"
              class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="例如: Jensen、Jacky..."
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
              >人員的職稱</label
            >
            <input
              v-model="currentEditInputStaffJobTitle"
              class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="例如: 襄理、工讀生..."
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
              >人員的帳號</label
            >
            <input
              v-model="currentEditInputStaffAccount"
              class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="請輸入帳號"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
              >登入用PIN</label
            >
            <input
              v-model="currentEditInputStaffPin"
              type="password"
              inputmode="numeric"
              maxlength="6"
              class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="留空則不變更"
            />
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-bold text-surface-700 dark:text-surface-300"
            >權限群組</label
          >
          <RoleSelect v-model="currentEditRoleId" />
        </div>
      </div>
      <div class="mt-5 flex justify-end gap-2.5">
        <button
          type="button"
          class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold"
          @click="closeEditStaffDialog"
        >
          取消
        </button>
        <button
          type="button"
          class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold"
          @click="editStaff"
        >
          保存
        </button>
      </div>
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Users } from 'lucide-vue-next'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import TablePagination from '@/components/ui/TablePagination.vue'
import RoleSelect from '@/components/ui/RoleSelect.vue'
import { alert, confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { useAuthorityManagementStore } from '@/stores/authorityManagement'
const authorityManagementStore = useAuthorityManagementStore()
import { useLoginStore } from '@/stores/login'
const loginStore = useLoginStore()
import type { StaffMember } from '@/types'
import { fromSelection, hasCapability } from '@/utils/selection'
import { ApiError } from '@/api/http'
import { toStaffMember } from '@/api/auth'
import {
  createStaff as createStaffApi,
  deleteStaff as deleteStaffApi,
  updateStaff as updateStaffApi
} from '@/api/staff'

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return `操作失敗：${err.message}`
  return '連不上伺服端，請確認網路連線'
}
const PIN_PATTERN = /^\d{4,6}$/

// 人員與權限群組由 App.vue 啟動時同步，CRUD 直接以 API 回應更新本機陣列，避免重複 fetch 覆蓋。

const canManage = computed(() => hasCapability(loginStore.userInfo, 'canManageStaff'))
// 不可編輯／刪除自己，避免操作中的帳號把自己鎖在門外；「最後一位權限管理者」則交由後端把關
// （見 apps/api/src/routes/staff.ts 的 wouldLeaveNoAuthorityAdmin），不再用 jobTitle==='店長' 字串比對。
function canEdit(row: StaffMember): boolean {
  return canManage.value && row.account !== fromSelection(loginStore.userInfo)?.account
}

const addStaffDialog = ref(false)
const currentInputStaffName = ref('')
const currentInputStaffJobTitle = ref('')
const currentInputStaffAccount = ref('')
const currentInputStaffPin = ref('')
const currentInputRoleId = ref('')
function openAddStaffDialog() {
  if (!canManage.value) return
  currentInputStaffName.value = ''
  currentInputStaffJobTitle.value = ''
  currentInputStaffAccount.value = ''
  currentInputStaffPin.value = ''
  // 刻意不預設角色（尤其不能偷懶挑第一筆——有可能剛好是「店長」），逼管理者每次都要明確選擇。
  currentInputRoleId.value = ''
  addStaffDialog.value = true
}
function closeAddStaffDialog() {
  addStaffDialog.value = false
  showToast('操作取消', 'error')
}
async function addStaff() {
  if (
    currentInputStaffName.value === '' ||
    currentInputStaffJobTitle.value === '' ||
    currentInputStaffAccount.value === '' ||
    currentInputStaffPin.value === '' ||
    currentInputRoleId.value === ''
  ) {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (!PIN_PATTERN.test(currentInputStaffPin.value)) {
    showToast('PIN 必須是 4 到 6 碼數字,請重新輸入', 'error')
    return
  }
  if (
    authorityManagementStore.staffList.find(
      (item) => item.account === currentInputStaffAccount.value
    )
  ) {
    showToast('此帳號已存在,請重新輸入', 'error')
    return
  }
  try {
    const created = await createStaffApi({
      name: currentInputStaffName.value,
      jobTitle: currentInputStaffJobTitle.value,
      account: currentInputStaffAccount.value,
      roleId: currentInputRoleId.value,
      pin: currentInputStaffPin.value
    })
    // 陣列重建以觸發 reactive 更新，並標記本機已異動以防背景同步覆蓋。
    authorityManagementStore.staffList = [
      ...authorityManagementStore.staffList,
      toStaffMember(created)
    ]
    showToast('新增人員成功', 'success')
    addStaffDialog.value = false
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

async function deleteStaff(row: StaffMember) {
  if (!canEdit(row)) return
  const result = await confirm({ title: '警告', description: `是否刪除人員 ${row.name} ?` })
  if (result !== 'confirm') return
  try {
    await deleteStaffApi(String(row.id))
    authorityManagementStore.staffList = authorityManagementStore.staffList.filter(
      (item) => item.id !== row.id
    )
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

const editStaffDialog = ref(false)
const currentEditStaff = ref<StaffMember | null>(null)
const currentEditInputStaffName = ref('')
const currentEditInputStaffJobTitle = ref('')
const currentEditInputStaffAccount = ref('')
const currentEditInputStaffPin = ref('')
const currentEditRoleId = ref('')
function openEditStaffDialog(row: StaffMember) {
  if (!canEdit(row)) {
    void alert({ title: '通知', description: '不可編輯自己的帳號', confirmText: '我知道了' })
    return
  }
  currentEditStaff.value = row
  currentEditInputStaffName.value = row.name
  currentEditInputStaffJobTitle.value = row.jobTitle
  currentEditInputStaffAccount.value = row.account
  currentEditInputStaffPin.value = ''
  currentEditRoleId.value = row.roleId
  editStaffDialog.value = true
}
function closeEditStaffDialog() {
  editStaffDialog.value = false
  showToast('操作取消', 'error')
}
async function editStaff() {
  const target = currentEditStaff.value
  if (!target) return
  if (
    currentEditInputStaffName.value === '' ||
    currentEditInputStaffJobTitle.value === '' ||
    currentEditInputStaffAccount.value === '' ||
    currentEditRoleId.value === ''
  ) {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (currentEditInputStaffPin.value !== '' && !PIN_PATTERN.test(currentEditInputStaffPin.value)) {
    showToast('PIN 必須是 4 到 6 碼數字,請重新輸入', 'error')
    return
  }
  if (
    currentEditInputStaffName.value === target.name &&
    currentEditInputStaffJobTitle.value === target.jobTitle &&
    currentEditInputStaffAccount.value === target.account &&
    currentEditInputStaffPin.value === '' &&
    currentEditRoleId.value === target.roleId
  ) {
    editStaffDialog.value = false
    showToast('保存成功', 'success')
    return
  }
  const anotherAccount = authorityManagementStore.staffList.filter((item) => item.id !== target.id)
  if (anotherAccount.some((item) => item.account === currentEditInputStaffAccount.value)) {
    showToast('此帳號已存在,請重新輸入', 'error')
    return
  }
  try {
    const updated = await updateStaffApi(String(target.id), {
      name: currentEditInputStaffName.value,
      jobTitle: currentEditInputStaffJobTitle.value,
      account: currentEditInputStaffAccount.value,
      roleId: currentEditRoleId.value,
      ...(currentEditInputStaffPin.value !== '' ? { pin: currentEditInputStaffPin.value } : {})
    })
    const mapped = toStaffMember(updated)
    const index = authorityManagementStore.staffList.findIndex((item) => item.id === target.id)
    if (index !== -1) authorityManagementStore.staffList[index] = mapped
    editStaffDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

const staffCurrentPage = ref(1)
function handleStaffCurrentChange(page: number) {
  staffCurrentPage.value = page
}
const sliceStaffList = computed(() => {
  return authorityManagementStore.staffList.slice(
    (staffCurrentPage.value - 1) * 10,
    staffCurrentPage.value * 10
  )
})
const staffPageCount = computed(() =>
  Math.max(Math.ceil(authorityManagementStore.staffList.length / 10), 1)
)
</script>

<style lang="scss" scoped></style>
