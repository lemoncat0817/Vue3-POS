import { createRouter, createWebHistory } from 'vue-router'
import { constantRoutes } from './routes'
import { useLoginStore } from '@/stores/login'
import { usePageStore } from '@/stores/page'
import { showToast } from '@/composables/useToast'
import { hasCapability } from '@/utils/selection'

/** 工廠函式建立 router 實例，便於單元測試隔離初次導航狀態。 */
export function createAppRouter() {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: constantRoutes
  })

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

export default router
