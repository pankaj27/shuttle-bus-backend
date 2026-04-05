import { ref } from 'vue'
import { settingService } from '@/services/setting.service'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'

export function useSettings() {
  const loading = ref(false)
  const error = ref(null)
  const authStore = useAuthStore()

  const fetchSettings = async (site) => {
    loading.value = true
    error.value = null
    try {
      const response = await settingService.fetch(site)
      if (response && (response.code === 200 || response.data?.status)) {
        return response.data.data || response.data
      } else {
        error.value = response?.data?.message || 'Failed to fetch settings'
        return null
      }
    } catch (err) {
      error.value = err.message || 'An error occurred'
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchBranding = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await settingService.fetchBranding()
      if (response && (response.code === 200 || response.data?.status)) {
        // Transform the response to match generalSettings structure
        const data = response.data?.data || response.data || response
        return {
          name: data.appName,
          logo: data.appLogo,
          light_logo: data.lightLogo || data.appLogo,
          dark_logo: data.darkLogo || data.appLogo,
        }
      } else {
        error.value = response?.data?.message || 'Failed to fetch branding'
        return null
      }
    } catch (err) {
      error.value = err.message || 'An error occurred'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateSettings = async (site, data) => {
    loading.value = true
    error.value = null
    try {
      const response = await settingService.update(site, data)
      if (response && (response.code === 200 || response.data?.status)) {
        message.success(
          `${site.charAt(0).toUpperCase() + site.slice(1).replace('_', ' ')} settings updated successfully`,
        )

        // Update auth store's generalSettings if we're updating general settings
        if (site === 'general') {
          authStore.updateGeneralSettings(data)
        }

        return true
      } else {
        message.error(response?.data?.message || 'Failed to update settings')
        return false
      }
    } catch (err) {
      message.error(err.message || 'An error occurred')
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchSettings,
    fetchBranding,
    updateSettings,
  }
}
