import { createRouter, createWebHashHistory } from 'vue-router'
import { constantRoutes } from './routes'
import { useLoginStore } from '@/stores/login'
import { useDeviceStore } from '@/stores/device'
import { usePageStore } from '@/stores/page'
import { showToast } from '@/composables/useToast'
import { hasCapability } from '@/utils/selection'
import { setDeviceTokenInvalidHandler, setOperatorSessionInvalidHandler } from '@/api/http'

export function createAppRouter() {
  const router = createRouter({
    // GitHub Pages 沒有 SPA fallback（子路徑下重新整理會回 404，已實測）；hash 模式不需要 404.html 這類技巧。
    history: createWebHashHistory(),
    routes: constantRoutes
  })

  router.beforeEach((to, from, next) => {
    const loginStore = useLoginStore()
    const deviceStore = useDeviceStore()

    // 需同時具備裝置憑證、登入旗標與 sessionToken 視為合法登入狀態。
    if (!deviceStore.deviceToken || !loginStore.isLogin || !loginStore.sessionToken) {
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

// 操作員 session 失效時統一清理狀態並重導向至登入頁。
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

// 裝置憑證失效時同步重設操作員 session 並導回登入頁。
setDeviceTokenInvalidHandler(() => {
  const loginStore = useLoginStore()
  const deviceStore = useDeviceStore()
  deviceStore.deviceToken = null
  loginStore.isLogin = false
  loginStore.userInfo = []
  loginStore.sessionToken = null
  if (router.currentRoute.value.name !== 'login') {
    router.push('/login')
    showToast('這台裝置的憑證已失效，請重新用 Google／GitHub 登入', 'error')
  }
})

export default router
