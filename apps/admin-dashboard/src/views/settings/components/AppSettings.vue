<script setup>
import { reactive, onMounted, computed } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { useSettings } from '@/composables/useSettings'
import { useAuthStore } from '@/stores/auth'
import { Modal } from 'ant-design-vue'

const authStore = useAuthStore()
const isDemo = computed(() => authStore.isDemo)
const { loading, fetchSettings, updateSettings } = useSettings()

const form = reactive({
  android_version: '',
  ios_version: '',
  playstore_url: '',
  appstore_url: '',
  background_location_update_interval: 1000,
  driver_online_location_update_interval: 1000,
  max_distance: 2000,
  prebooking_time: 30,
   startbooking_minute:30
})

onMounted(async () => {
  const data = await fetchSettings('app')
  if (data) {
    Object.assign(form, data)
  }
})

const handleSave = async () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating app behavior settings is disabled in Demo Mode.',
    });
    return;
  }
  await updateSettings('app', form)
}
</script>

<template>
  <div>
    <div class="category-header">
      <div class="icon-box bg-purple-50 text-purple-600">
        <LucideIcon name="Smartphone" />
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800">App Settings</h3>
        <p class="text-sm text-gray-500">Mobile application versions and behavior.</p>
      </div>
    </div>

    <a-form layout="vertical" class="mt-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div class="platform-card bg-blue-50/30 border-blue-100">
          <h4 class="font-bold text-blue-900 mb-4 flex items-center gap-2">
            <LucideIcon name="Play" :size="16" /> Android
          </h4>
          <a-form-item label="Live Version">
            <a-input v-model:value="form.android_version" :disabled="isDemo" />
          </a-form-item>
          <a-form-item label="Playstore URL">
            <a-input v-model:value="form.playstore_url" :disabled="isDemo" />
          </a-form-item>
        </div>

        <div class="platform-card bg-purple-50/30 border-purple-100">
          <h4 class="font-bold text-purple-900 mb-4 flex items-center gap-2">
            <LucideIcon name="Apple" :size="16" /> iOS
          </h4>
          <a-form-item label="Live Version">
            <a-input v-model:value="form.ios_version" :disabled="isDemo" />
          </a-form-item>
          <a-form-item label="Appstore URL">
            <a-input v-model:value="form.appstore_url" :disabled="isDemo" />
          </a-form-item>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <a-form-item label="Background Location Update (ms)">
          <a-input-number v-model:value="form.background_location_update_interval" class="w-full" :disabled="isDemo" />
        </a-form-item>
        <a-form-item label="Driver Online Update (ms)">
          <a-input-number
            v-model:value="form.driver_online_location_update_interval"
            class="w-full"
            :disabled="isDemo"
          />
        </a-form-item>
        <a-form-item label="Max Search Distance (m)">
          <a-input-number v-model:value="form.max_distance" class="w-full" :disabled="isDemo" />
        </a-form-item>
        <a-form-item label="Prebooking Time (minutes)">
          <a-input-number v-model:value="form.prebooking_time" class="w-full" :disabled="isDemo" />
        </a-form-item>

        <a-form-item label="Driver Start Trip Before Departure Time (minutes)">
          <a-input-number v-model:value="form.startbooking_minute" class="w-full" :disabled="isDemo" />
        </a-form-item>
      </div>

      <!-- <div class="maintenance-banner">
        <div class="flex items-center gap-4">
          <div class="banner-icon">
            <LucideIcon name="AlertTriangle" />
          </div>
          <div>
            <h4 class="font-bold text-orange-900">Maintenance Mode</h4>
            <p class="text-sm text-orange-700">Block all app traffic for updates.</p>
          </div>
        </div>
        <a-switch v-model:checked="form.maintenance_mode" />
      </div> -->

    <div class="flex flex-col items-end mt-12">
      <a-alert
        v-if="isDemo"
        message="Demo Mode Active"
        description="Mobile application behavior settings are locked in this demonstration."
        type="warning"
        show-icon
        class="mb-6 w-full md:w-auto"
      />
      <a-button
        v-if="!isDemo"
        type="primary"
        class="submit-btn"
        :loading="loading"
        @click="handleSave"
      >
        Save Changes
      </a-button>
    </div>
    </a-form>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.category-header {
  @apply flex items-center gap-4 border-b border-gray-100 pb-6;
}

.icon-box {
  @apply w-12 h-12 rounded-2xl flex items-center justify-center;
}

.platform-card {
  @apply p-6 rounded-3xl border;
}

.maintenance-banner {
  @apply p-6 bg-orange-50/50 rounded-3xl border border-orange-100 flex items-center justify-between;
}

.banner-icon {
  @apply w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-orange-500;
}

.submit-btn {
  @apply h-12 px-12 rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center;
}

:deep(.ant-input),
:deep(.ant-textarea),
:deep(.ant-input-password),
:deep(.ant-input-number),
:deep(.ant-select-selector) {
  @apply rounded-xl border-gray-200 transition-all duration-200 bg-gray-50/50;
  border-radius: 0.75rem !important;
  background-color: rgb(249 250 251 / 0.5) !important;
}

:deep(.ant-input:hover),
:deep(.ant-input:focus),
:deep(.ant-textarea:hover),
:deep(.ant-textarea:focus),
:deep(.ant-select-selector:hover) {
  @apply border-blue-400 ring-4 ring-blue-50 bg-white;
  background-color: #ffffff !important;
}

:deep(.ant-form-item-label > label) {
  @apply text-sm font-bold text-gray-600 mb-1;
}

:deep(.ant-switch-checked) {
  @apply bg-blue-600;
}
</style>
