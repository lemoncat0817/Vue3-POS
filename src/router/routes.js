export const constantRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),

    meta: {
      title: '登入'
    }
  }
]
