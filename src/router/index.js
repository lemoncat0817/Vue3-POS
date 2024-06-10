import { createRouter, createWebHistory } from 'vue-router'
import { constantRoutes } from './routes'
import { useLoginStore } from '@/stores/login'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes
})

// 設置導航守衛
router.beforeEach(async (to, from, next) => {
  const loginStore = useLoginStore()
  if (loginStore.isLogin) {
    if (to.name === 'login') {
      next('/')
    } else if (to.name === 'order') {
      if (loginStore.userInfo.canCheckOrder === 'O') {
        next()
      } else {
        next(false)
        ElMessage.error('您沒有權限訪問該頁面, 請聯繫管理員')
      }
    } else if (to.name === 'backgroundSetting') {
      if (loginStore.userInfo.canCheckBackgroundSetting === 'O') {
        next()
      } else {
        next(false)
        ElMessage.error('您沒有權限訪問該頁面, 請聯繫管理員')
      }
    } else if (to.name === 'dataAnalysis') {
      if (loginStore.userInfo.canCheckDataAnalysis === 'O') {
        next()
      } else {
        next(false)
        ElMessage.error('您沒有權限訪問該頁面, 請聯繫管理員')
      }
    } else if (to.name === 'authorityManagement') {
      if (loginStore.userInfo.canCheckAuthority === 'O') {
        next()
      } else {
        next(false)
        ElMessage.error('您沒有權限訪問該頁面, 請聯繫管理員')
      }
    } else {
      next()
    }
  } else {
    if (to.name === 'login') {
      next()
    } else {
      next('/login')
    }
  }
})

export default router
