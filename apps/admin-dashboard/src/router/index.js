import { createRouter, createWebHashHistory } from 'vue-router'
import NProgress from 'nprogress'
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue'
import routes from './routes'

// NProgress Configuration
NProgress.configure({ showSpinner: false })

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// Navigation Guards
router.beforeEach(async (to, from, next) => {
  NProgress.start()

  const authStore = useAuthStore()

  // Dynamic Title
  const siteName = authStore.generalSettings?.name || 'Bus Shuttle'
  document.title = to.meta.title ? `${to.meta.title} | ${siteName}` : siteName

  // Public routes that don't require authentication
  const publicRoutes = ['/terms', '/privacy-policy', '/delete-account']
  if (publicRoutes.includes(to.path)) {
    return next()
  }

  // 1. Check for routes that require authentication
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!authStore.isAuthenticated) {
      NProgress.done()
      return next({ name: 'login' })
    }

    // If authenticated but user data is missing (e.g., after a refresh), fetch it
    if (!authStore.user) {
      try {
        const result = await authStore.fetchAccess()
        if (!result.success) {
          authStore.logout()
          NProgress.done()
          return next({ name: 'login' })
        }
      } catch (error) {
        authStore.logout()
        NProgress.done()
        return next({ name: 'login' })
      }
    }

    const userPermissions = authStore.user?.permissions || []

    // 2. Check for route-level permissions
    const requiredPermissions = to.matched.reduce((acc, record) => {
      if (record.meta.permissions) {
        return [...acc, ...record.meta.permissions]
      }
      return acc
    }, [])

    if (requiredPermissions.length > 0) {
      const hasPermission =
        userPermissions.includes('master.admin') ||
        requiredPermissions.every((permission) => userPermissions.includes(permission))

      if (!hasPermission) {
        console.warn('Unauthorized access attempt to:', to.path)
        message.warning('You do not have permission to access this page.')
        if (to.name === 'dashboard') {
          authStore.logout()
          NProgress.done()
          return next({ name: 'login' })
        }
        NProgress.done()
        return next({ name: 'dashboard' })
      }
    }

    // 3. Demo Mode Route Restrictions
    if (authStore.isDemo && to.matched.some((record) => record.meta.demoRestricted)) {
      message.warning('This feature is restricted in Demo Mode.')
      NProgress.done()
      return next({ name: from.name || 'dashboard' })
    }

    next()
  }
  // 3. Check for routes that are only for guests (e.g., Login)
  else if (to.matched.some((record) => record.meta.guest)) {
    if (authStore.isAuthenticated) {
      next({ name: 'dashboard' })
    } else {
      next()
    }
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
