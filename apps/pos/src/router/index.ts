import { createRouter, createWebHistory } from 'vue-router'
import { constantRoutes } from './routes'
import { useLoginStore } from '@/stores/login'
import { usePageStore } from '@/stores/page'
import { showToast } from '@/composables/useToast'
import { fromSelection } from '@/utils/selection'

/**
 * 建立掛好導航守衛的 router 實例。拆成獨立工廠函式（而不是直接在模組
 * 頂層建立一個單例）是為了讓 index.spec.ts 能在每個測試案例各自拿到一個
 * 全新、還沒有任何導航紀錄的 router——D-12 的「應用程式剛啟動時還原上次
 * 頁籤」邏輯要靠 `from.matched.length === 0`（vue-router 判斷「這是第一次
 * 導航」的方式）才測得到，共用同一個單例會讓這個條件只有第一個測試案例
 * 真的成立。正式環境（main.ts）只會呼叫一次，行為跟原本的模組單例沒有
 * 差別。
 */
export function createAppRouter() {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: constantRoutes
  })

  // 設置導航守衛
  //
  // D-11 修復：原本 4 個受保護的路由各自寫一段幾乎一樣的 if/else，分別
  // 檢查各自對應的權限欄位。現在改成通用地讀 to.meta.capability（見
  // routes.ts），一個路由需要什麼權限就宣告在路由自己身上，這裡不用再為
  // 每個新頁面多加一段分支。
  router.beforeEach((to, from, next) => {
    const loginStore = useLoginStore()

    if (!loginStore.isLogin) {
      if (to.name === 'login') {
        next()
      } else {
        next('/login')
      }
      return
    }

    if (to.name === 'login') {
      next('/')
      return
    }

    // D-12 修復：還原上次瀏覽的頁籤。原本這段邏輯掛在 App.vue 的
    // onMounted，靠另外手動維護的 pageStore.currentPage（見 stores/
    // page.ts 修改前的版本）判斷——跟這裡的路由狀態是兩份要手動同步的
    // 東西。現在只在「應用程式剛啟動、還沒有任何一次真正的導航」時
    // （from.matched.length === 0 是 vue-router 判斷這是初次導航的方式）
    // 介入一次，把落點換成 pageStore 記錄的「上次造訪的路由名稱」（由下面
    // 的 router.afterEach 自動寫入）。換過去的目的地一樣會重新跑一次這個
    // 守衛，底下的權限檢查一樣會套用，行為跟原本一致。
    if (from.matched.length === 0 && to.name === 'home') {
      const lastVisitedName = usePageStore().lastVisitedName
      if (lastVisitedName && lastVisitedName !== 'home') {
        next({ name: lastVisitedName })
        return
      }
    }

    const capability = to.meta.capability
    if (capability && fromSelection(loginStore.userInfo)?.[capability] !== 'O') {
      next(false)
      showToast('您沒有權限訪問該頁面, 請聯繫管理員', 'error')
      return
    }

    next()
  })

  router.afterEach((to) => {
    if (typeof to.name === 'string') {
      usePageStore().lastVisitedName = to.name
    }
  })

  return router
}

const router = createAppRouter()

export default router
