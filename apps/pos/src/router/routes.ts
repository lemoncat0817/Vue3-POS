import type { RouteRecordRaw } from 'vue-router'
import type { AuthorityKey } from '@/types/staff'

/** 路由元資訊擴充：`capability` 宣告造訪該路由所需具備的權限。未設定代表登入即可造訪。 */
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
  },
  {
    // 點餐首頁使用全寬頂部列版型。
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
      }
    ]
  },
  {
    // 後台功能頁共用側邊欄後台版型。
    path: '/',
    component: () => import('@/layout/admin/index.vue'),
    children: [
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
      },
      {
        path: '/tables',
        name: 'tables',
        component: () => import('@/views/tables/index.vue'),
        meta: {
          title: '桌況管理',
          capability: 'canManageTables'
        }
      },
      {
        path: '/auditLog',
        name: 'auditLog',
        component: () => import('@/views/auditLog/index.vue'),
        meta: {
          title: '操作紀錄',
          capability: 'canCheckAuditLog'
        }
      }
    ]
  },
  {
    // 無效網址一律導回點餐首頁，避免 RouterView 無內容可渲染而黑屏。
    path: '/:pathMatch(.*)*',
    redirect: '/home'
  }
]
