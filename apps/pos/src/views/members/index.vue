<template>
  <div class="w-full flex flex-col items-center bg-surface-50/50 dark:bg-surface-950 px-4 py-6">
    <div class="w-full max-w-7xl flex flex-col gap-5">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 shadow-sm"
      >
        <div>
          <h1
            class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-100 tracking-tight"
          >
            會員管理
          </h1>
          <p class="mt-1 text-xs lg:text-sm text-surface-500 dark:text-surface-400">
            查詢顧客消費歷程、管理會員集點與維護顧客資料庫
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2 text-xs lg:text-sm font-bold text-surface-600 dark:text-surface-300 transition-all hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-95 select-none"
            @click="openAnalyticsDialog"
          >
            <BarChart3 class="h-4 w-4" />
            <span>會員分析</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2 text-xs lg:text-sm font-bold text-surface-600 dark:text-surface-300 transition-all hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-95 select-none"
            @click="openBirthdaysDialog"
          >
            <Cake class="h-4 w-4" />
            <span>本月壽星</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2 text-xs lg:text-sm font-bold text-surface-600 dark:text-surface-300 transition-all hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-95 select-none"
            :class="{ 'pointer-events-none opacity-40': !canManage }"
            @click="openTiersDialog"
          >
            <Gem class="h-4 w-4" />
            <span>分級設定</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2 text-xs lg:text-sm font-bold text-surface-600 dark:text-surface-300 transition-all hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-95 select-none"
            :class="{ 'pointer-events-none opacity-40': !canManage }"
            @click="openPointsSettingDialog"
          >
            <Coins class="h-4 w-4" />
            <span>點數設定</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs lg:text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95 shadow-md shadow-primary-600/25 select-none"
            :class="{ 'pointer-events-none opacity-40': !canManage }"
            @click="openAddDialog"
          >
            <UserPlus class="h-4 w-4" />
            <span>新增會員</span>
          </button>
        </div>
      </div>

      <div
        class="w-full overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm flex flex-col justify-between min-h-[540px]"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-100 dark:border-surface-800 px-5 py-3.5"
        >
          <div class="text-sm font-black text-surface-900 dark:text-surface-100">會員名單</div>
          <form class="flex items-center gap-2" @submit.prevent="onSearchSubmit">
            <div class="relative">
              <Search
                class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400"
              />
              <input
                v-model="searchInput"
                type="text"
                placeholder="搜尋姓名或手機號碼"
                class="w-56 rounded-lg border border-surface-300 bg-white py-1.5 pl-8 pr-3 text-xs text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
              />
            </div>
            <button type="submit" class="pos-btn pos-btn-secondary px-3 py-1.5 text-xs">搜尋</button>
            <button
              v-if="activeSearch"
              type="button"
              class="pos-btn pos-btn-secondary px-3 py-1.5 text-xs"
              @click="clearSearch"
            >
              清除
            </button>
          </form>
        </div>

        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left text-sm">
            <thead
              class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
            >
              <tr>
                <th class="w-16 px-4 py-3.5 text-center">序號</th>
                <th class="px-4 py-3.5 text-left">姓名</th>
                <th class="px-4 py-3.5 text-left">分級</th>
                <th class="px-4 py-3.5 text-left">手機</th>
                <th class="px-4 py-3.5 text-right">點數</th>
                <th class="px-4 py-3.5 text-left">生日</th>
                <th class="px-4 py-3.5 text-left">加入時間</th>
                <th class="px-4 py-3.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="members.length === 0">
                <td
                  colspan="8"
                  class="px-4 py-16 text-center text-surface-400 dark:text-surface-500"
                >
                  <div class="flex flex-col items-center justify-center gap-2">
                    <Users class="h-10 w-10 text-surface-300 dark:text-surface-700" />
                    <span class="text-base font-semibold text-surface-700 dark:text-surface-300">{{
                      activeSearch ? '找不到符合的會員' : '目前無會員'
                    }}</span>
                    <span class="text-xs text-surface-400 dark:text-surface-500">{{
                      activeSearch
                        ? `沒有姓名或手機號碼包含「${activeSearch}」的會員`
                        : '尚未建立任何會員資料，可點選上方「新增會員」'
                    }}</span>
                  </div>
                </td>
              </tr>
              <tr
                v-for="(member, index) in members"
                :key="member.id"
                class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
              >
                <td class="px-4 py-3.5 text-center font-mono text-xs text-surface-400">
                  {{ (memberPage - 1) * memberPageSize + index + 1 }}
                </td>
                <td class="px-4 py-3.5 text-left font-bold text-surface-900 dark:text-surface-100">
                  <div class="flex flex-col gap-1">
                    <span>{{ member.name }}</span>
                    <div v-if="member.tags.length > 0" class="flex flex-wrap gap-1">
                      <span
                        v-for="tag in member.tags"
                        :key="tag"
                        class="rounded-full bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 text-[10px] font-medium text-surface-500 dark:text-surface-400"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3.5 text-left">
                  <span
                    v-if="member.tierStatus?.tier"
                    class="inline-flex items-center gap-1 rounded-full bg-accent-50 dark:bg-accent-950/40 px-2 py-0.5 text-[11px] font-bold text-accent-700 dark:text-accent-400"
                  >
                    <Gem class="h-3 w-3" />{{ member.tierStatus.tier.name }}
                  </span>
                  <span v-else class="text-xs text-surface-400 dark:text-surface-500">一般會員</span>
                </td>
                <td class="px-4 py-3.5 text-left font-mono text-surface-600 dark:text-surface-400">
                  {{ member.phone }}
                </td>
                <td
                  class="px-4 py-3.5 text-right font-mono font-bold text-primary-600 dark:text-primary-400"
                >
                  {{ member.points }}
                </td>
                <td class="px-4 py-3.5 text-left font-mono text-surface-500 dark:text-surface-400">
                  {{ member.birthday ?? '—' }}
                </td>
                <td class="px-4 py-3.5 text-left text-surface-500 dark:text-surface-400">
                  {{ formatDateOnly(member.createdAt) }}
                </td>
                <td class="px-4 py-3.5 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
                      @click="openDetail(member)"
                    >
                      消費紀錄
                    </button>
                    <button
                      type="button"
                      class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
                      :class="{ 'pointer-events-none opacity-40': !canManage }"
                      @click="openEditDialog(member)"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      class="pos-btn pos-btn-danger px-2.5 py-1 text-xs"
                      :class="{ 'pointer-events-none opacity-40': !canManage }"
                      @click="deleteMemberRow(member)"
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
          :page="memberPage"
          :page-count="memberPageCount"
          :total="memberTotalCount"
          :current-count="members.length"
          unit="位會員"
          @update:page="handleMemberPageChange"
        />
      </div>

      <ModalDialog v-model:open="addDialog" title="新增會員">
        <Form
          v-slot="{ isSubmitting }"
          :validation-schema="toTypedSchema(memberSchema())"
          :initial-values="{ name: '', phone: '', birthday: '', tags: '', notes: '' }"
          @submit="onSubmitAdd"
        >
          <FormField name="name" label="姓名" :disabled="isSubmitting" placeholder="例如: 王小明" />
          <FormField
            name="phone"
            label="手機號碼"
            inputmode="numeric"
            :disabled="isSubmitting"
            :maxlength="10"
            placeholder="例如: 0912345678"
          />
          <FormField name="birthday" label="生日（選填）" type="date" :disabled="isSubmitting" />
          <FormField
            name="tags"
            label="標籤（選填，用逗號分隔）"
            :disabled="isSubmitting"
            placeholder="例如: 常點無糖, 對堅果過敏"
          />
          <FormField name="notes" label="備註（選填）" :disabled="isSubmitting" placeholder="例如: 喜歡坐窗邊" />
          <div class="mt-2 flex justify-end gap-2">
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-4 py-2 text-sm font-bold"
              @click="addDialog = false"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="pos-btn pos-btn-primary px-4 py-2 text-sm font-bold"
            >
              新增
            </button>
          </div>
        </Form>
      </ModalDialog>

      <ModalDialog v-model:open="editDialog" title="編輯會員">
        <Form
          v-slot="{ isSubmitting }"
          :validation-schema="toTypedSchema(memberSchema(currentMember?.id))"
          :initial-values="{
            name: currentMember?.name ?? '',
            phone: currentMember?.phone ?? '',
            birthday: currentMember?.birthday ?? '',
            tags: currentMember?.tags?.join(', ') ?? '',
            notes: currentMember?.notes ?? ''
          }"
          @submit="onSubmitEdit"
        >
          <FormField name="name" label="姓名" :disabled="isSubmitting" placeholder="例如: 王小明" />
          <FormField
            name="phone"
            label="手機號碼"
            inputmode="numeric"
            :disabled="isSubmitting"
            :maxlength="10"
            placeholder="例如: 0912345678"
          />
          <FormField name="birthday" label="生日（選填）" type="date" :disabled="isSubmitting" />
          <FormField
            name="tags"
            label="標籤（選填，用逗號分隔）"
            :disabled="isSubmitting"
            placeholder="例如: 常點無糖, 對堅果過敏"
          />
          <FormField name="notes" label="備註（選填）" :disabled="isSubmitting" placeholder="例如: 喜歡坐窗邊" />
          <div class="mt-2 flex justify-end gap-2">
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-4 py-2 text-sm font-bold"
              @click="editDialog = false"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="pos-btn pos-btn-primary px-4 py-2 text-sm font-bold"
            >
              保存
            </button>
          </div>
        </Form>
      </ModalDialog>

      <ModalDialog
        v-model:open="detailDialog"
        :title="`${detail?.name ?? ''} 的消費紀錄`"
        size="xl"
      >
        <div
          class="mb-3 flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3.5 py-2.5"
        >
          <span class="text-xs font-bold text-surface-600 dark:text-surface-400">目前分級</span>
          <div class="flex items-center gap-2">
            <span
              v-if="detail?.tierStatus?.tier"
              class="inline-flex items-center gap-1 rounded-full bg-accent-50 dark:bg-accent-950/40 px-2 py-0.5 text-[11px] font-bold text-accent-700 dark:text-accent-400"
            >
              <Gem class="h-3 w-3" />{{ detail.tierStatus.tier.name }}
            </span>
            <span v-else class="text-xs text-surface-400 dark:text-surface-500">一般會員</span>
            <span class="text-[11px] text-surface-400 dark:text-surface-500"
              >（累積消費 {{ detail?.tierStatus?.lifetimeSpend ?? 0 }} 元）</span
            >
          </div>
        </div>
        <div
          v-if="detail && (detail.tags.length > 0 || detail.notes)"
          class="mb-3 flex flex-col gap-1.5 rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3.5 py-2.5"
        >
          <div v-if="detail.tags.length > 0" class="flex flex-wrap gap-1.5">
            <span
              v-for="tag in detail.tags"
              :key="tag"
              class="rounded-full bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-[11px] font-medium text-surface-600 dark:text-surface-300"
            >
              {{ tag }}
            </span>
          </div>
          <p v-if="detail.notes" class="text-xs text-surface-600 dark:text-surface-400">
            備註：{{ detail.notes }}
          </p>
        </div>
        <div
          class="mb-3 flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-800/60 px-3.5 py-2.5"
        >
          <span class="text-xs font-bold text-surface-600 dark:text-surface-400">目前累積點數</span>
          <div class="flex items-center gap-2.5">
            <span class="font-mono text-sm font-black text-primary-600 dark:text-primary-400"
              >{{ detail?.points ?? 0 }} 點</span
            >
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
              :class="{ 'pointer-events-none opacity-40': !canManage }"
              @click="openAdjustPointsDialog"
            >
              調整點數
            </button>
          </div>
        </div>
        <div class="mb-4 overflow-hidden rounded-xl border border-surface-200 dark:border-surface-800">
          <table class="w-full text-left text-sm">
            <thead
              class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
            >
              <tr>
                <th class="px-3 py-2.5 text-left">訂單編號</th>
                <th class="px-3 py-2.5 text-left">時間</th>
                <th class="px-3 py-2.5 text-center">狀態</th>
                <th class="px-3 py-2.5 text-right">金額</th>
                <th class="px-3 py-2.5 text-right">獲得點數</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="!detail || detail.orders.items.length === 0">
                <td
                  colspan="5"
                  class="px-3 py-8 text-center text-surface-400 dark:text-surface-500"
                >
                  <div class="flex flex-col items-center justify-center gap-1.5">
                    <Receipt class="h-8 w-8 text-surface-300 dark:text-surface-700" />
                    <span class="text-xs font-semibold text-surface-600 dark:text-surface-400"
                      >還沒有消費紀錄</span
                    >
                  </div>
                </td>
              </tr>
              <tr
                v-for="order in detail?.orders.items ?? []"
                :key="order.orderId"
                class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
              >
                <td
                  class="px-3 py-2.5 font-mono text-xs font-bold text-surface-900 dark:text-surface-100"
                >
                  {{ order.orderId }}
                </td>
                <td class="px-3 py-2.5 text-xs text-surface-500 dark:text-surface-400">
                  {{ formatDateTime(order.orderTime) }}
                </td>
                <td class="px-3 py-2.5 text-center">
                  <span
                    class="inline-flex items-center rounded-full bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-[11px] font-bold text-surface-600 dark:text-surface-300"
                  >
                    {{ order.orderStatus }}
                  </span>
                </td>
                <td
                  class="px-3 py-2.5 text-right font-mono text-xs font-bold text-surface-900 dark:text-surface-100"
                >
                  {{ order.orderPaymentPrice }} 元
                </td>
                <td
                  class="px-3 py-2.5 text-right font-mono text-xs font-bold text-primary-600 dark:text-primary-400"
                >
                  {{ order.pointsEarned }} 點
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          v-if="detail"
          class="mb-4"
          :page="detailOrdersPage"
          :page-count="detail.orders.pagination.totalPages"
          :total="detail.orders.pagination.totalCount"
          :current-count="detail.orders.items.length"
          unit="筆消費紀錄"
          @update:page="handleDetailOrdersPageChange"
        />

        <div class="mb-2 text-xs font-black text-surface-700 dark:text-surface-300">點數異動明細</div>
        <div class="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-800">
          <table class="w-full text-left text-sm">
            <thead
              class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
            >
              <tr>
                <th class="px-3 py-2.5 text-left">時間</th>
                <th class="px-3 py-2.5 text-left">來源</th>
                <th class="px-3 py-2.5 text-right">異動點數</th>
                <th class="px-3 py-2.5 text-left">備註</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="!detail || detail.pointsLedger.length === 0">
                <td colspan="4" class="px-3 py-8 text-center text-surface-400 dark:text-surface-500">
                  <span class="text-xs font-semibold text-surface-600 dark:text-surface-400"
                    >還沒有點數異動</span
                  >
                </td>
              </tr>
              <tr
                v-for="entry in detail?.pointsLedger ?? []"
                :key="entry.id"
                class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
              >
                <td class="px-3 py-2.5 text-xs text-surface-500 dark:text-surface-400">
                  {{ formatDateTime(entry.createdAt) }}
                </td>
                <td class="px-3 py-2.5 text-xs text-surface-700 dark:text-surface-300">
                  {{ pointsLedgerReasonLabel(entry.reason) }}
                </td>
                <td
                  class="px-3 py-2.5 text-right font-mono text-xs font-bold"
                  :class="entry.delta >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-danger-600 dark:text-danger-400'"
                >
                  {{ entry.delta >= 0 ? '+' : '' }}{{ entry.delta }}
                </td>
                <td class="px-3 py-2.5 text-xs text-surface-500 dark:text-surface-400">
                  {{ entry.note ?? entry.operator ?? '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ModalDialog>

      <ModalDialog v-model:open="adjustPointsDialog" title="調整點數">
        <Form
          v-slot="{ isSubmitting }"
          :validation-schema="toTypedSchema(adjustPointsSchema)"
          :initial-values="{ delta: '', reason: '' }"
          @submit="onSubmitAdjustPoints"
        >
          <p class="mb-3 text-xs text-surface-500 dark:text-surface-400">
            {{ detail?.name }} 目前 {{ detail?.points ?? 0 }} 點。加點請輸入正數，扣點請輸入負數（例如
            -20），扣點不能讓點數變成負值。
          </p>
          <FormField
            name="delta"
            label="調整量"
            type="number"
            :disabled="isSubmitting"
            placeholder="例如: 50 或 -20"
          />
          <FormField
            name="reason"
            label="調整原因"
            :disabled="isSubmitting"
            placeholder="例如: 生日活動加點、客訴補償"
          />
          <div class="mt-2 flex justify-end gap-2">
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-4 py-2 text-sm font-bold"
              @click="adjustPointsDialog = false"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="pos-btn pos-btn-primary px-4 py-2 text-sm font-bold"
            >
              確認調整
            </button>
          </div>
        </Form>
      </ModalDialog>

      <ModalDialog v-model:open="pointsSettingDialog" title="點數設定">
        <div class="flex flex-col gap-3">
          <p class="text-xs text-surface-500 dark:text-surface-400">
            設定顧客消費多少元累加 1 點、結帳時每多少點可以折抵 1 元，調整後只套用到「儲存之後」新產生的訂單，已入帳／已折抵的點數不會被回頭改寫。
          </p>
          <label class="block text-sm font-bold text-surface-700 dark:text-surface-300">
            消費多少元累加 1 點
            <input
              :value="pointsPerCurrencyUnitInput"
              type="text"
              inputmode="numeric"
              min="1"
              step="1"
              :disabled="pointsSettingSaving || pointsSettingLoading"
              class="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:disabled:bg-surface-900 dark:disabled:text-surface-600"
              @input="pointsPerCurrencyUnitInput = parseRequiredInt(($event.target as HTMLInputElement).value)"
            />
            <span
              v-if="pointsPerCurrencyUnitInput < 1"
              class="mt-1 block text-xs font-bold text-danger-600 dark:text-danger-400"
              >請輸入 1 以上的整數</span
            >
          </label>
          <label class="block text-sm font-bold text-surface-700 dark:text-surface-300">
            結帳時每多少點折抵 1 元
            <input
              :value="pointsRedemptionRateInput"
              type="text"
              inputmode="numeric"
              min="1"
              step="1"
              :disabled="pointsSettingSaving || pointsSettingLoading"
              class="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:disabled:bg-surface-900 dark:disabled:text-surface-600"
              @input="pointsRedemptionRateInput = parseRequiredInt(($event.target as HTMLInputElement).value)"
            />
            <span
              v-if="pointsRedemptionRateInput < 1"
              class="mt-1 block text-xs font-bold text-danger-600 dark:text-danger-400"
              >請輸入 1 以上的整數</span
            >
          </label>
          <div class="border-t border-surface-200 pt-3 dark:border-surface-800">
            <label class="flex items-center gap-2 text-sm font-bold text-surface-700 dark:text-surface-300">
              <input
                type="checkbox"
                :checked="pointsExpiryEnabled"
                :disabled="pointsSettingSaving || pointsSettingLoading"
                class="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 dark:border-surface-700"
                @change="onTogglePointsExpiry(($event.target as HTMLInputElement).checked)"
              />
              啟用點數到期規則
            </label>
            <p class="mt-1 text-xs text-surface-500 dark:text-surface-400">
              會員連續幾個月完全沒有點數異動（消費累點、折抵、手動調整）就整包歸零，不是逐筆到期。
            </p>
            <input
              v-if="pointsExpiryEnabled"
              :value="pointsExpiryMonthsInput ?? ''"
              type="text"
              inputmode="numeric"
              min="1"
              step="1"
              placeholder="幾個月沒有異動就歸零"
              :disabled="pointsSettingSaving || pointsSettingLoading"
              class="mt-2 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:disabled:bg-surface-900 dark:disabled:text-surface-600"
              @input="pointsExpiryMonthsInput = parseOptionalInt(($event.target as HTMLInputElement).value)"
            />
            <span
              v-if="pointsExpiryEnabled && (pointsExpiryMonthsInput ?? 0) < 1"
              class="mt-1 block text-xs font-bold text-danger-600 dark:text-danger-400"
              >請輸入 1 以上的整數</span
            >
          </div>
          <div class="mt-2 flex justify-end gap-2">
            <button
              type="button"
              class="pos-btn pos-btn-secondary px-4 py-2 text-sm font-bold"
              @click="pointsSettingDialog = false"
            >
              取消
            </button>
            <button
              type="button"
              :disabled="
                pointsSettingSaving ||
                pointsSettingLoading ||
                !Number.isInteger(pointsPerCurrencyUnitInput) ||
                pointsPerCurrencyUnitInput < 1 ||
                !Number.isInteger(pointsRedemptionRateInput) ||
                pointsRedemptionRateInput < 1 ||
                (pointsExpiryEnabled &&
                  (!Number.isInteger(pointsExpiryMonthsInput) || (pointsExpiryMonthsInput ?? 0) < 1))
              "
              class="pos-btn pos-btn-primary px-4 py-2 text-sm font-bold"
              @click="onSavePointsSetting"
            >
              儲存
            </button>
          </div>
        </div>
      </ModalDialog>

      <ModalDialog v-model:open="birthdaysDialog" title="本月壽星">
        <div class="flex flex-col gap-3">
          <p class="text-xs text-surface-500 dark:text-surface-400">
            以下是這個月生日的會員名單，依日期排序，可用來安排生日禮遇或簡訊祝賀。
          </p>
          <div v-if="birthdaysLoading" class="py-8 text-center text-xs text-surface-400">載入中…</div>
          <div
            v-else-if="birthdayEntries.length === 0"
            class="flex flex-col items-center justify-center gap-1.5 py-8"
          >
            <Cake class="h-8 w-8 text-surface-300 dark:text-surface-700" />
            <span class="text-xs font-semibold text-surface-600 dark:text-surface-400"
              >這個月沒有會員生日</span
            >
          </div>
          <div v-else class="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-800">
            <table class="w-full text-left text-sm">
              <thead
                class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
              >
                <tr>
                  <th class="px-3 py-2.5 text-left">姓名</th>
                  <th class="px-3 py-2.5 text-left">手機</th>
                  <th class="px-3 py-2.5 text-left">生日</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
                <tr v-for="entry in birthdayEntries" :key="entry.id">
                  <td class="px-3 py-2.5 font-bold text-surface-900 dark:text-surface-100">
                    {{ entry.name }}
                  </td>
                  <td class="px-3 py-2.5 font-mono text-surface-600 dark:text-surface-400">
                    {{ entry.phone }}
                  </td>
                  <td class="px-3 py-2.5 font-mono text-surface-600 dark:text-surface-400">
                    {{ entry.birthday }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ModalDialog>

      <ModalDialog v-model:open="tiersDialog" title="會員分級設定">
        <div class="flex flex-col gap-3">
          <p class="text-xs text-surface-500 dark:text-surface-400">
            依會員累積消費金額（不含已作廢訂單）自動比對最高符合的等級，沒有達到任何門檻是「一般會員」。
          </p>
          <div class="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-800">
            <table class="w-full text-left text-sm">
              <thead
                class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
              >
                <tr>
                  <th class="px-3 py-2.5 text-left">等級名稱</th>
                  <th class="px-3 py-2.5 text-right">累積消費門檻</th>
                  <th class="px-3 py-2.5 text-center">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
                <tr v-if="sortedTiers.length === 0">
                  <td colspan="3" class="px-3 py-8 text-center text-xs text-surface-400">
                    尚未設定任何分級門檻
                  </td>
                </tr>
                <tr v-for="tier in sortedTiers" :key="tier.id">
                  <td class="px-3 py-2.5 font-bold text-surface-900 dark:text-surface-100">
                    {{ tier.name }}
                  </td>
                  <td class="px-3 py-2.5 text-right font-mono text-surface-600 dark:text-surface-400">
                    {{ tier.minSpend }} 元
                  </td>
                  <td class="px-3 py-2.5 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
                        @click="openEditTier(tier)"
                      >
                        編輯
                      </button>
                      <button
                        type="button"
                        class="pos-btn pos-btn-danger px-2.5 py-1 text-xs"
                        @click="removeTier(tier)"
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Form
            v-slot="{ isSubmitting }"
            :validation-schema="toTypedSchema(tierFormSchema)"
            :initial-values="{ name: editingTier?.name ?? '', minSpend: editingTier?.minSpend ?? '' }"
            @submit="onSubmitTier"
          >
            <div class="text-xs font-black text-surface-700 dark:text-surface-300 mb-1.5">
              {{ editingTier ? '編輯分級門檻' : '新增分級門檻' }}
            </div>
            <FormField name="name" label="等級名稱" :disabled="isSubmitting" placeholder="例如: 金卡會員" />
            <FormField
              name="minSpend"
              label="累積消費門檻（元）"
              type="text"
              inputmode="numeric"
              :disabled="isSubmitting"
              placeholder="例如: 10000"
            />
            <div class="mt-2 flex justify-end gap-2">
              <button
                v-if="editingTier"
                type="button"
                class="pos-btn pos-btn-secondary px-4 py-2 text-sm font-bold"
                @click="editingTier = null"
              >
                取消編輯
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="pos-btn pos-btn-primary px-4 py-2 text-sm font-bold"
              >
                {{ editingTier ? '保存' : '新增' }}
              </button>
            </div>
          </Form>
        </div>
      </ModalDialog>

      <ModalDialog v-model:open="analyticsDialog" title="會員分析">
        <div v-if="analyticsLoading" class="py-8 text-center text-xs text-surface-400">載入中…</div>
        <div v-else-if="analytics" class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-2.5">
            <div class="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
              <div class="text-[11px] font-bold text-surface-400">總會員數</div>
              <div class="mt-1 font-mono text-xl font-black text-surface-900 dark:text-surface-100">
                {{ analytics.totalMembers }}
              </div>
            </div>
            <div class="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
              <div class="text-[11px] font-bold text-surface-400">本月新增會員</div>
              <div class="mt-1 font-mono text-xl font-black text-surface-900 dark:text-surface-100">
                {{ analytics.newMembersThisMonth }}
              </div>
            </div>
            <div class="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
              <div class="text-[11px] font-bold text-surface-400">會員貢獻營收</div>
              <div class="mt-1 font-mono text-xl font-black text-primary-600 dark:text-primary-400">
                $ {{ analytics.memberRevenue }}
              </div>
            </div>
            <div class="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
              <div class="text-[11px] font-bold text-surface-400">會員營收佔比</div>
              <div class="mt-1 font-mono text-xl font-black text-surface-900 dark:text-surface-100">
                {{ memberRevenueSharePercent }}%
              </div>
            </div>
          </div>

          <div>
            <div class="mb-2 text-xs font-black text-surface-700 dark:text-surface-300">分級人數分布</div>
            <div class="flex flex-col gap-2">
              <div
                v-for="entry in analytics.tierDistribution"
                :key="entry.tierId ?? '一般會員'"
                class="flex items-center gap-2.5"
              >
                <span class="w-20 shrink-0 truncate text-xs font-bold text-surface-600 dark:text-surface-400">
                  {{ entry.tierName }}
                </span>
                <div class="h-4 flex-1 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
                  <div
                    class="h-full rounded-full bg-accent-500"
                    :style="{ width: `${tierBarWidth(entry.memberCount)}%` }"
                  />
                </div>
                <span class="w-8 shrink-0 text-right font-mono text-xs font-bold text-surface-500">
                  {{ entry.memberCount }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ModalDialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BarChart3, Cake, Coins, Gem, Receipt, Search, UserPlus, Users } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Form } from 'vee-validate'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import TablePagination from '@/components/ui/TablePagination.vue'
import { useLoginStore } from '@/stores/login'
import { fromSelection, hasCapability } from '@/utils/selection'
import { formatDateOnly, formatDateTime } from '@/utils/time'
import { parseOptionalInt, parseRequiredInt } from '@/utils/numberInput'
import { ApiError, apiErrorMessage as sharedApiErrorMessage } from '@/api/http'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import {
  adjustMemberPoints,
  createMember,
  deleteMember,
  fetchMemberAnalytics,
  fetchMemberBirthdays,
  fetchMemberDetail,
  fetchMembers,
  findMemberByPhone,
  updateMember
} from '@/api/members'
import { fetchTenantSettings, updateTenantSettings } from '@/api/tenant-settings'
import {
  createMemberTier,
  deleteMemberTier,
  fetchMemberTiers,
  updateMemberTier
} from '@/api/member-tiers'
import {
  memberBirthdaySchema,
  memberPhoneSchema,
  type Member,
  type MemberAnalytics,
  type MemberBirthdayEntry,
  type MemberDetail,
  type MemberPointLedgerReason,
  type MemberTier
} from '@pos/contract'

const loginStore = useLoginStore()
const canManage = () => hasCapability(loginStore.userInfo, 'canManageMembers')

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 409) return '這個手機號碼已經是會員'
  return sharedApiErrorMessage(err)
}

// 會員名單為後台管理專用資料，無需離線可用；改成後端分頁＋搜尋，不再
// 一次整批撈回來前端切頁——會員一多，整表下載對流量跟畫面都是負擔。
const members = ref<Member[]>([])
const memberPage = ref(1)
const memberPageSize = 10
const memberPageCount = ref(1)
const memberTotalCount = ref(0)
const searchInput = ref('')
// 目前實際套用中的搜尋字——跟 searchInput 分開，避免打字打到一半就觸發搜尋。
const activeSearch = ref('')

async function loadMembers() {
  try {
    const result = await fetchMembers({
      q: activeSearch.value || undefined,
      page: memberPage.value,
      pageSize: memberPageSize
    })
    members.value = result.items
    memberPageCount.value = result.pagination.totalPages
    memberTotalCount.value = result.pagination.totalCount
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
function onSearchSubmit() {
  activeSearch.value = searchInput.value.trim()
  memberPage.value = 1
  loadMembers()
}
function clearSearch() {
  searchInput.value = ''
  activeSearch.value = ''
  memberPage.value = 1
  loadMembers()
}
function handleMemberPageChange(page: number) {
  memberPage.value = page
  loadMembers()
}
onMounted(loadMembers)

function memberSchema(excludeId?: string) {
  return z.object({
    name: z.string().trim().min(1, '請輸入姓名'),
    // @pos/contract 用 zod v4、這裡是 apps/pos 自己的 zod v3（見 api/http.ts
    // 的 isZodError 說明），兩邊的 schema 物件型別互不相容，沒辦法直接把
    // memberPhoneSchema 接到這裡的 z.object() 裡；改成只呼叫它的 safeParse()
    // 判斷格式，規則本身還是單一來源，只是驗證動作留在 v3 這邊組合。
    phone: z
      .string()
      .trim()
      .refine(
        (phone) => memberPhoneSchema.safeParse(phone).success,
        '請輸入正確的手機號碼格式（09 開頭共 10 碼數字）'
      )
      // 現在後台名單是分頁的，members.value 只有目前這一頁，沒辦法可靠地
      // 判斷「這支手機是不是別人已經在用」，改成直接問伺服端（結帳查會員
      // 用的同一支 API，不需要額外權限）；查詢本身失敗（離線／連線問題）
      // 不擋住送出，交給送出當下伺服端的 409 做最後把關。
      .refine(async (phone) => {
        if (!memberPhoneSchema.safeParse(phone).success) return true
        try {
          const found = await findMemberByPhone(phone)
          return !found || found.id === excludeId
        } catch {
          return true
        }
      }, '這個手機號碼已經是會員'),
    // 選填：空字串代表沒有填，送出時轉成 null（見 onSubmitAdd／onSubmitEdit）。
    birthday: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || memberBirthdaySchema.safeParse(value).success,
        '請輸入正確的日期格式'
      ),
    // 選填：逗號分隔的純文字，送出時拆成陣列（見 parseTagsInput）。
    tags: z.string(),
    // 選填：空字串代表沒有填，送出時轉成 null。
    notes: z.string()
  })
}

/** 逗號分隔的標籤輸入，拆成陣列並去除空白／空字串。 */
function parseTagsInput(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

const addDialog = ref(false)
function openAddDialog() {
  if (!canManage()) return
  addDialog.value = true
}
async function onSubmitAdd(values: Record<string, unknown>) {
  const input = values as { name: string; phone: string; birthday: string; tags: string; notes: string }
  try {
    await createMember({
      name: input.name,
      phone: input.phone,
      birthday: input.birthday || null,
      tags: parseTagsInput(input.tags),
      notes: input.notes.trim() || null
    })
    addDialog.value = false
    showToast('新增成功', 'success')
    await loadMembers()
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
  const input = values as { name: string; phone: string; birthday: string; tags: string; notes: string }
  try {
    await updateMember(currentMember.value.id, {
      name: input.name,
      phone: input.phone,
      birthday: input.birthday || null,
      tags: parseTagsInput(input.tags),
      notes: input.notes.trim() || null
    })
    editDialog.value = false
    showToast('保存成功', 'success')
    await loadMembers()
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

async function deleteMemberRow(member: Member) {
  if (!canManage()) return
  const result = await confirm({
    title: '警告',
    description: `是否刪除會員 ${member.name}？`,
    variant: 'danger'
  })
  if (result !== 'confirm') return
  try {
    await deleteMember(member.id)
    showToast('刪除成功', 'success')
    // 刪掉當頁最後一筆時，這一頁可能已經不存在了，退回上一頁再重新拉。
    if (members.value.length === 1 && memberPage.value > 1) memberPage.value -= 1
    await loadMembers()
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

const detailDialog = ref(false)
const detail = ref<MemberDetail | null>(null)
const detailOrdersPage = ref(1)
const detailOrdersPageSize = 10
async function openDetail(member: Member) {
  detailOrdersPage.value = 1
  try {
    detail.value = await fetchMemberDetail(member.id, { ordersPageSize: detailOrdersPageSize })
    detailDialog.value = true
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
async function handleDetailOrdersPageChange(page: number) {
  if (!detail.value) return
  detailOrdersPage.value = page
  try {
    detail.value = await fetchMemberDetail(detail.value.id, {
      ordersPage: page,
      ordersPageSize: detailOrdersPageSize
    })
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

const POINTS_LEDGER_REASON_LABELS: Record<MemberPointLedgerReason, string> = {
  order_accrual: '消費累加',
  refund_reversal: '退款收回',
  void_reversal: '作廢收回',
  restore_award: '撤銷作廢退還',
  redemption: '結帳折抵',
  redemption_refund: '作廢退還折抵',
  manual_adjustment: '手動調整',
  expiration: '點數到期歸零'
}
function pointsLedgerReasonLabel(reason: MemberPointLedgerReason): string {
  return POINTS_LEDGER_REASON_LABELS[reason]
}

const adjustPointsDialog = ref(false)
const adjustPointsSchema = z.object({
  delta: z.coerce
    .number({ invalid_type_error: '請輸入整數，加點請輸入正數、扣點請輸入負數' })
    .int()
    .refine((value) => value !== 0, '調整量不能是 0'),
  reason: z.string().trim().min(1, '請說明調整原因')
})
function openAdjustPointsDialog() {
  if (!canManage() || !detail.value) return
  adjustPointsDialog.value = true
}
async function onSubmitAdjustPoints(values: Record<string, unknown>) {
  if (!detail.value) return
  const input = values as { delta: number; reason: string }
  const operatorName = fromSelection(loginStore.userInfo)
  try {
    const updated = await adjustMemberPoints(detail.value.id, {
      delta: input.delta,
      reason: input.reason,
      operator: operatorName ? `${operatorName.jobTitle} - ${operatorName.name}` : '未知操作員'
    })
    // 調整成功後整份重新拉最新的消費紀錄＋異動明細，不手動拼湊——後端才是
    // 唯一可信來源，尤其異動明細的排序、內容都是伺服端組出來的。
    detail.value = await fetchMemberDetail(updated.id, {
      ordersPage: detailOrdersPage.value,
      ordersPageSize: detailOrdersPageSize
    })
    const target = members.value.find((item) => item.id === updated.id)
    if (target) target.points = updated.points
    adjustPointsDialog.value = false
    showToast('點數調整成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

// 消費多少元累加 1 點、結帳每多少點折抵 1 元，業主可自訂——跟營業設定的
// 換日時間一樣存在租戶層級，見 apps/api/src/routes/tenant-settings.ts。
const pointsSettingDialog = ref(false)
const pointsPerCurrencyUnitInput = ref(10)
const pointsRedemptionRateInput = ref(10)
// 到期規則用「啟用開關 + 月數」兩個欄位表達一個 nullable 數字：關閉開關存
// 的是 null（停用），打開開關卻沒填月數不能送出（見上面儲存按鈕的 disabled 判斷）。
const pointsExpiryEnabled = ref(false)
const pointsExpiryMonthsInput = ref<number | null>(null)
const pointsSettingLoading = ref(false)
const pointsSettingSaving = ref(false)
function onTogglePointsExpiry(checked: boolean) {
  pointsExpiryEnabled.value = checked
  if (!checked) pointsExpiryMonthsInput.value = null
  else if (pointsExpiryMonthsInput.value === null) pointsExpiryMonthsInput.value = 6
}
async function openPointsSettingDialog() {
  if (!canManage()) return
  pointsSettingDialog.value = true
  pointsSettingLoading.value = true
  try {
    const settings = await fetchTenantSettings()
    pointsPerCurrencyUnitInput.value = settings.pointsPerCurrencyUnit
    pointsRedemptionRateInput.value = settings.pointsRedemptionRate
    pointsExpiryEnabled.value = settings.pointsExpiryMonths !== null
    pointsExpiryMonthsInput.value = settings.pointsExpiryMonths
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  } finally {
    pointsSettingLoading.value = false
  }
}
async function onSavePointsSetting() {
  pointsSettingSaving.value = true
  try {
    const settings = await updateTenantSettings({
      pointsPerCurrencyUnit: pointsPerCurrencyUnitInput.value,
      pointsRedemptionRate: pointsRedemptionRateInput.value,
      pointsExpiryMonths: pointsExpiryEnabled.value ? pointsExpiryMonthsInput.value : null
    })
    pointsPerCurrencyUnitInput.value = settings.pointsPerCurrencyUnit
    pointsRedemptionRateInput.value = settings.pointsRedemptionRate
    pointsExpiryEnabled.value = settings.pointsExpiryMonths !== null
    pointsExpiryMonthsInput.value = settings.pointsExpiryMonths
    pointsSettingDialog.value = false
    showToast('已更新點數設定', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  } finally {
    pointsSettingSaving.value = false
  }
}

// 本月壽星名單，供生日行銷（禮遇、簡訊祝賀）用；查看只需要 canCheckMembers
// （能進這個頁面就有），不像新增/編輯/刪除需要 canManageMembers。
const birthdaysDialog = ref(false)
const birthdaysLoading = ref(false)
const birthdayEntries = ref<MemberBirthdayEntry[]>([])
async function openBirthdaysDialog() {
  birthdaysDialog.value = true
  birthdaysLoading.value = true
  try {
    birthdayEntries.value = await fetchMemberBirthdays()
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  } finally {
    birthdaysLoading.value = false
  }
}

// 會員分級門檻：業主自訂「累積消費滿多少元升到哪一級」，等級本身不存在
// 會員身上，由伺服端即時算好附在 member.tierStatus 裡（見 @pos/contract
// 的 memberTierStatusSchema）。
const tiersDialog = ref(false)
const tiers = ref<MemberTier[]>([])
const sortedTiers = computed(() => [...tiers.value].sort((a, b) => b.minSpend - a.minSpend))
const editingTier = ref<MemberTier | null>(null)
const tierFormSchema = z.object({
  name: z.string().trim().min(1, '請輸入等級名稱'),
  minSpend: z.coerce.number({ invalid_type_error: '請輸入數字' }).int().min(0, '門檻不能是負數')
})

async function loadTiers() {
  try {
    tiers.value = await fetchMemberTiers()
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
function openTiersDialog() {
  if (!canManage()) return
  editingTier.value = null
  tiersDialog.value = true
  loadTiers()
}
function openEditTier(tier: MemberTier) {
  editingTier.value = tier
}
async function onSubmitTier(values: Record<string, unknown>) {
  const input = values as { name: string; minSpend: number }
  try {
    if (editingTier.value) {
      await updateMemberTier(editingTier.value.id, input)
      showToast('保存成功', 'success')
    } else {
      await createMemberTier(input)
      showToast('新增成功', 'success')
    }
    editingTier.value = null
    await loadTiers()
    // 分級門檻變動會影響所有會員目前的等級，重新整理當頁名單讓畫面對得起來。
    await loadMembers()
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
async function removeTier(tier: MemberTier) {
  const result = await confirm({
    title: '警告',
    description: `是否刪除分級門檻「${tier.name}」？`,
    variant: 'danger'
  })
  if (result !== 'confirm') return
  try {
    await deleteMemberTier(tier.id)
    if (editingTier.value?.id === tier.id) editingTier.value = null
    showToast('刪除成功', 'success')
    await loadTiers()
    await loadMembers()
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

// 會員經營摘要（總會員數／本月新增／會員貢獻營收／分級人數分布），
// 查看只需要 canCheckMembers（能進這個頁面就有）。
const analyticsDialog = ref(false)
const analyticsLoading = ref(false)
const analytics = ref<MemberAnalytics | null>(null)
const memberRevenueSharePercent = computed(() => {
  if (!analytics.value || analytics.value.totalRevenue === 0) return 0
  return Math.round((analytics.value.memberRevenue / analytics.value.totalRevenue) * 100)
})
function tierBarWidth(count: number): number {
  if (!analytics.value) return 0
  const max = Math.max(1, ...analytics.value.tierDistribution.map((entry) => entry.memberCount))
  return Math.round((count / max) * 100)
}
async function openAnalyticsDialog() {
  analyticsDialog.value = true
  analyticsLoading.value = true
  try {
    analytics.value = await fetchMemberAnalytics()
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  } finally {
    analyticsLoading.value = false
  }
}
</script>

<style scoped></style>
