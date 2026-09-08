import type { RouteRecordRaw } from 'vue-router'
import type { AuthorityKey } from '@/types/staff'

/**
 * D-11 修復：權限保護原本寫死在 router/index.ts 的 beforeEach 裡，一個
 * 路由對應一段 if/else 分支。改成路由自己宣告「需要哪個權限欄位」
 * （meta.capability），beforeEach 改成通用地讀這個欄位（見該檔案）——
 * 新增一個受保護頁面只需要在這裡加一行 meta，不用回頭改導航守衛本身。
 * 沒有寫 capability 代表「登入即可造訪」，例如點餐首頁。
 */
declare module 'vue-router' {
  interface RouteMeta {
    capability?: AuthorityKey
  }
}

export const constantRoutes: RouteRecordRaw[] = [
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
          title: '查看訂單',
          capability: 'canCheckOrder'
        }
      },
      {
        path: '/backgroundSetting',
        name: 'backgroundSetting',
        component: () => import('@/views/backgroundSetting/index.vue'),
        meta: {
          title: '後臺設定',
          capability: 'canCheckBackgroundSetting'
        }
      },
      {
        path: '/dataAnalysis',
        name: 'dataAnalysis',
        component: () => import('@/views/dataAnalysis/index.vue'),
        meta: {
          title: '數據分析',
          capability: 'canCheckDataAnalysis'
        }
      },
      {
        path: '/authorityManagement',
        name: 'authorityManagement',
        component: () => import('@/views/authorityManagement/index.vue'),
        meta: {
          title: '權限管理',
          capability: 'canCheckAuthority'
        }
      },
      {
        path: '/members',
        name: 'members',
        component: () => import('@/views/members/index.vue'),
        meta: {
          title: '會員管理',
          capability: 'canCheckMembers'
        }
      }
    ]
  }
]
