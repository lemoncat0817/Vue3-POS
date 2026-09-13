import type { RouteRecordRaw } from 'vue-router'
import type { AuthorityKey } from '@/types/staff'

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
    path: '/:pathMatch(.*)*',
    redirect: '/home'
  }
]
