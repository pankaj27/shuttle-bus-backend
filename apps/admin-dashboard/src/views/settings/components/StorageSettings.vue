<script setup>
import { reactive, onMounted, computed } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { useSettings } from '@/composables/useSettings'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { Modal } from 'ant-design-vue'

const { loading, fetchSettings, updateSettings } = useSettings()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const form = reactive({
  name: 'local',
  // S3 / Spaces
  spaces: {
    access_key: '',
    secret_key: '',
    region: 'ap-south-1',
    bucket: '',
    endpoint: '',
    cdn_url:''
  },
  // Cloudinary
  cloudinary: {
    cloud_name: '',
    api_key: '',
    api_secret: '',
  },
})

const isDemo = computed(() => authStore.isDemo)

onMounted(async () => {
  const data = await fetchSettings('storage')
  if (data) {
    Object.assign(form, data)
  }
})

const handleSave = async () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating storage settings is disabled in Demo Mode.',
    });
    return;
  }
  await updateSettings('storage', form)
}
</script>

<template>
  <div>
    <div class="category-header">
      <div
        class="icon-box transition-colors duration-300"
        :class="themeStore.isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-50 text-cyan-600'"
      >
        <LucideIcon name="HardDrive" />
      </div>
      <div>
        <h3
          class="text-xl font-bold transition-colors duration-300"
          :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
        >
          Storage Configuration
        </h3>
        <p
          class="text-sm transition-colors duration-300"
          :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
        >
          Manage cloud storage for assets and uploads.
        </p>
      </div>
    </div>

    <a-form layout="vertical" class="mt-8">
      <a-form-item label="Storage Provider">
        <a-select v-model:value="form.name" size="large" :disabled="authStore.isDemo">
          <a-select-option value="local">Local Storage</a-select-option>
          <a-select-option value="spaces">Amazon S3 / DigitalOcean Spaces</a-select-option>
          <a-select-option value="cloudinary">Cloudinary</a-select-option>
        </a-select>
      </a-form-item>

      <!-- S3 / Spaces Configuration -->
      <div
        v-if="form.name === 'spaces'"
        class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <a-form-item label="Access Key">
          <a-input v-model:value="form.spaces.access_key" size="large" placeholder="AKIA..." :disabled="authStore.isDemo" />
        </a-form-item>
        <a-form-item label="Secret Key">
          <a-input-password v-model:value="form.spaces.secret_key" size="large" :disabled="authStore.isDemo" />
        </a-form-item>
        <a-form-item label="S3 Region">
          <a-input v-model:value="form.spaces.region" size="large" placeholder="us-east-1" :disabled="authStore.isDemo" />
        </a-form-item>
        <a-form-item label="Bucket Name">
          <a-input v-model:value="form.spaces.bucket" size="large" :disabled="authStore.isDemo" />
        </a-form-item>
        <div class="md:col-span-2">
          <a-form-item label="Endpoint (Optional for S3, required for Spaces)">
            <a-input
              v-model:value="form.spaces.endpoint"
              size="large"
              placeholder="https://nyc3.digitaloceanspaces.com"
              :disabled="authStore.isDemo"
            />
          </a-form-item>
        </div>
        <a-form-item label="CDN URL">
          <a-input v-model:value="form.spaces.cdn_url" size="large" placeholder="https://nyc3.cdn.digitaloceanspaces.com" :disabled="authStore.isDemo" />
        </a-form-item>
      </div>

      <!-- Cloudinary Configuration -->
      <div
        v-if="form.name === 'cloudinary'"
        class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <a-form-item label="Cloud Name">
          <a-input v-model:value="form.cloudinary.cloud_name" size="large" :disabled="authStore.isDemo" />
        </a-form-item>
        <a-form-item label="API Key">
          <a-input v-model:value="form.cloudinary.api_key" size="large" :disabled="authStore.isDemo" />
        </a-form-item>
        <div class="md:col-span-2">
          <a-form-item label="API Secret">
            <a-input-password v-model:value="form.cloudinary.api_secret" size="large" :disabled="authStore.isDemo" />
          </a-form-item>
        </div>
      </div>

      <!-- Local Storage Info -->
      <div
        v-if="form.name === 'local'"
        class="p-4 rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/20"
      >
        <div class="flex gap-3">
          <LucideIcon name="Info" class="text-blue-500" :size="20" />
          <div>
            <p class="text-sm font-medium text-blue-900 dark:text-blue-200">Local Storage Active</p>
            <p class="text-xs text-blue-700 dark:text-blue-400 mt-1">
              Files will be uploaded directly to the server's public/storage directory.
            </p>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-end mt-12 border-t pt-8">
        <a-alert
          v-if="isDemo"
          message="Demo Mode Active"
          description="Cloud storage and bucket configurations are locked in this demonstration."
          type="warning"
          show-icon
          class="mb-6 w-full md:w-auto"
        />
        <a-button
          v-if="!isDemo"
          type="primary"
          size="large"
          class="submit-btn"
          :loading="loading"
          @click="handleSave"
        >
          Update Storage
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.category-header {
  @apply flex items-center gap-4 border-b pb-6;
}

:deep(.category-header) {
  border-color: v-bind('themeStore.isDark ? "#374151" : "#f3f4f6"');
}

.icon-box {
  @apply w-12 h-12 rounded-2xl flex items-center justify-center;
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
}

:deep(.dark) :is(.ant-input, .ant-textarea, .ant-input-password, .ant-input-number, .ant-select-selector),
html.dark :is(.ant-input, .ant-textarea, .ant-input-password, .ant-input-number, .ant-select-selector) {
  @apply bg-gray-900/50 border-gray-700 text-gray-200;
  background-color: rgba(17, 24, 39, 0.5) !important;
  border-color: #374151 !important;
}

:deep(.ant-input:hover),
:deep(.ant-input:focus),
:deep(.ant-textarea:hover),
:deep(.ant-textarea:focus),
:deep(.ant-select-selector:hover) {
  @apply border-blue-400 ring-4 ring-blue-50 bg-white;
  background-color: #ffffff !important;
}

:deep(.dark) :is(.ant-input:hover, .ant-input:focus, .ant-textarea:hover, .ant-textarea:focus, .ant-select-selector:hover),
html.dark :is(.ant-input:hover, .ant-input:focus, .ant-textarea:hover, .ant-textarea:focus, .ant-select-selector:hover) {
  @apply border-blue-500 ring-blue-900/20 bg-gray-800;
  background-color: #1f2937 !important;
}

:deep(.ant-form-item-label > label) {
  @apply text-sm font-bold text-gray-600 mb-1 transition-colors duration-300;
}

:deep(.dark) .ant-form-item-label > label,
html.dark .ant-form-item-label > label {
  @apply text-gray-400;
}
</style>
