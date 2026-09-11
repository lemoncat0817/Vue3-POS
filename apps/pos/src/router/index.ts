import { createRouter, createWebHistory } from 'vue-router'
import { constantRoutes } from './routes'
import { useLoginStore } from '@/stores/login'
import { usePageStore } from '@/stores/page'
import { showToast } from '@/composables/useToast'
import { hasCapability } from '@/utils/selection'
import { setOperatorSessionInvalidHandler } from '@/api/http'

/** 工廠函式建立 router 實例，便於單元測試隔離初次導航狀態。 */
export function createAppRouter() {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: constantRoutes
  })

  router.beforeEach((to, from, next) => {
    const loginStore = useLoginStore()

    // isLogin 單獨不代表真的登入——沒有 sessionToken 就打不了任何寫入 API
    // （見 api/http.ts、後端 requireCapability）。舊版（session 機制上線前）
    // 持久化的 isLogin: true、或 session 過期後沒有正確清乾淨，都會落在
    // 這裡，一律當未登入處理，避免看起來能操作卻每個按鈕都失敗。
    if (!loginStore.isLogin || !loginStore.sessionToken) {
      if (loginStore.isLogin) {
        loginStore.isLogin = false
        loginStore.userInfo = []
      }
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

    // 初次載入時還原上次造訪的頁籤。
    if (from.matched.length === 0 && to.name === 'home') {
      const lastVisitedName = usePageStore().lastVisitedName
      if (lastVisitedName && lastVisitedName !== 'home') {
        next({ name: lastVisitedName })
        return
      }
    }

    const capability = to.meta.capability
    if (capability && !hasCapability(loginStore.userInfo, capability)) {
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

// 任何一次 API 呼叫收到「操作員 session 缺漏或過期」都代表目前登入狀態
// 已經失效，統一在這裡強制登出＋導回登入頁，不必每個呼叫端各自處理
// （見 api/http.ts 的 setOperatorSessionInvalidHandler）。
setOperatorSessionInvalidHandler(() => {
  const loginStore = useLoginStore()
  loginStore.isLogin = false
  loginStore.userInfo = []
  loginStore.sessionToken = null
  if (router.currentRoute.value.name !== 'login') {
    router.push('/login')
    showToast('登入狀態已失效，請重新登入', 'error')
  }
})

export default router
