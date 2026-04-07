import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { userService } from '@/services/user.service'

export const useAuthStore = defineStore(
  'auth',
  () => {
    // State
    const user = ref(null)
    const token = ref(null)
    const refreshToken = ref(null)
    const expiresIn = ref(0)
    const loading = ref(false)
    const generalSettings = ref({}) // Site-wide settings (name, logo, etc.)
    const demoMode = ref(false)

    // Getters
    const isAuthenticated = computed(() => !!token.value)
    const hasPermission = (permission) => {
      return user.value?.permissions?.includes(permission)
    }
    const isDemo = computed(() => demoMode.value)

    const toBoolean = (value) => value === true || value === 'true'

    function setProfile(userData) {
      user.value.firstname = userData.firstname
      user.value.lastname = userData.lastname
      user.value.picture = userData.avatar || userData.picture
      user.value.phone = userData.phone
      user.value.country_code = userData.country_code
    }

    function setToken(token) {
      token.value = token.accessToken
      refreshToken.value = token.refreshToken
      expiresIn.value = token.expiresIn
    }

    async function login(email, password) {
      loading.value = true
      try {
        const userData = await api.post('auth/login', { email, password })

        if (userData.accessToken) {
          token.value = userData.accessToken
          refreshToken.value = userData.refreshToken
          expiresIn.value = userData.expiresIn
          user.value = {
            ...userData.user,
          }
          demoMode.value = toBoolean(userData.demoMode)

          localStorage.setItem('accessToken', userData.accessToken)
          localStorage.setItem('refreshToken', userData.refreshToken)
          localStorage.setItem('expiresIn', userData.expiresIn)

          // Immediately sync permissions and general settings
          await fetchAccess()

          return { success: true }
        } else {
          return { success: false, error: 'Invalid response from server' }
        }
      } catch (error) {
        console.error('Login error:', error)
        const errorMessage = error.response?.data?.message || error.message || 'Login failed'
        return { success: false, error: errorMessage }
      } finally {
        loading.value = false
      }
    }

    async function fetchAccess() {
      try {
        // Updated to match old project: POST /auth/access with roleId
        const payload = user.value?.roleId ? { roleId: user.value.roleId } : {}
        const response = await api.get('auth/access', { params: payload })

        // Populate permissions and site-wide general config
        if (user.value) {
          user.value.permissions = response.permissions || []
        }
        generalSettings.value = response.generalSettings || {}
        demoMode.value = toBoolean(response.demoMode)

        return { success: true, user: user.value, generalSettings: generalSettings.value }
      } catch (error) {
        console.error('Fetch user details error:', error)
        if (error.response?.status === 401) {
          logout()
        }
        return { success: false, error: error.message }
      }
    }

    async function logout() {
      try {
        // Try to notify backend, but don't block logout if it fails
        if (user.value?.id) {
          await userService.logout(user.value.id)
        }
      } catch (error) {
        console.error('Logout API call failed:', error)
        // Continue with local logout even if API fails
      }

      // Clear local state
      user.value = null
      token.value = null
      refreshToken.value = null
      expiresIn.value = null
      demoMode.value = false

      // Keep only branding in generalSettings on logout
      if (generalSettings.value) {
        const { name, logo, light_logo, dark_logo } = generalSettings.value
        generalSettings.value = { name, logo, light_logo, dark_logo }
      }

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('expiresIn')
    }

    function updateGeneralSettings(newSettings) {
      generalSettings.value = { ...generalSettings.value, ...newSettings }
    }

    return {
      // State
      user,
      token,
      refreshToken,
      expiresIn,
      loading,
      generalSettings,
      demoMode,
      // Getters
      isAuthenticated,
      hasPermission,
      isDemo,
      setProfile,
      setToken,
      // Actions
      login,
      fetchAccess,
      logout,
      updateGeneralSettings,
    }
  },
  {
    persist: true,
  },
)
