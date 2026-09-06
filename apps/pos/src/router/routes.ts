export const constantRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登入'
    }
  }, {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'home',
        component: () => import('@/views/home/index.vue'),
        meta: {
          title: '點餐'
        }
      },
      {
        path: '/order',
        name: 'order',
        component: () => import('@/views/order/index.vue'),
        meta: {
          title: '查看訂單'
        }
      },
      {
        path: '/backgroundSetting',
        name: 'backgroundSetting',
        component: () => import('@/views/backgroundSetting/index.vue'),
        meta: {
          title: '後臺設定'
        }
      },
      {
        path: '/dataAnalysis',
        name: 'dataAnalysis',
        component: () => import('@/views/dataAnalysis/index.vue'),
        meta: {
          title: '數據分析'
        }
      },
      {
        path: '/authorityManagement',
        name: 'authorityManagement',
        component: () => import('@/views/authorityManagement/index.vue'),
        meta: {
          title: '權限管理'
        }
      }
    ]
  }
]
