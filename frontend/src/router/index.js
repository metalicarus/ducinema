import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/',
      name: 'collection',
      component: () => import('../views/CollectionView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
      meta: { requiresAuth: true }
    },
     {
      path: '/collection/:userId',
      name: 'public-collection',
      component: () => import('../views/PublicCollectionView.vue'),
      meta: { public: true }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
      meta: { requiresGuest: true }
    }
  ]
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Aguarda carregamento da auth
  if (authStore.loading) {
    const unwatch = authStore.$subscribe(() => {
      if (!authStore.loading) {
        unwatch()
        checkAuth()
      }
    })
  } else {
    checkAuth()
  }

  function checkAuth() {
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next('/login')
    } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
      next('/')
    } else {
      next()
    }
  }
})

export default router
