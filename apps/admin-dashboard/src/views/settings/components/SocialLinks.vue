<script setup>
import { reactive, onMounted, computed } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { useSettings } from '@/composables/useSettings'
import { useAuthStore } from '@/stores/auth'
import { Modal } from 'ant-design-vue'
import { useThemeStore } from '@/stores/theme'

const authStore = useAuthStore()
const isDemo = computed(() => authStore.isDemo)
const { loading, fetchSettings, updateSettings } = useSettings()
const themeStore = useThemeStore()

const form = reactive({
  facebook: '',
  twitter: '',
  instagram: '',
  linkedin: '',
})

onMounted(async () => {
  const data = await fetchSettings('social')
  if (data) {
    Object.assign(form, data)
  }
})

const handleSave = async () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating social links is disabled in Demo Mode.',
    });
    return;
  }
  await updateSettings('social', form)
}
</script>

<template>
  <div>
    <div
      class="category-header transition-colors duration-300"
      :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-100'"
    >
      <div
        class="icon-box transition-colors duration-300"
        :class="themeStore.isDark ? 'bg-pink-900/30 text-pink-400' : 'bg-pink-50 text-pink-600'"
      >
        <LucideIcon name="Share2" />
      </div>
      <div>
        <h3
          class="text-xl font-bold transition-colors duration-300"
          :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
        >
          Social Connections
        </h3>
        <p
          class="text-sm transition-colors duration-300"
          :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
        >
          Link your brand's social media profiles.
        </p>
      </div>
    </div>

    <a-form layout="vertical" class="mt-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a-form-item label="Facebook URL">
          <a-input v-model:value="form.facebook" size="large" :disabled="isDemo">
            <template #prefix
              ><LucideIcon name="Facebook" :size="16" class="mr-2 text-blue-600"
            /></template>
          </a-input>
        </a-form-item>
        <a-form-item label="Twitter URL">
          <a-input v-model:value="form.twitter" size="large" :disabled="isDemo">
            <template #prefix
              ><LucideIcon name="Twitter" :size="16" class="mr-2 text-sky-400"
            /></template>
          </a-input>
        </a-form-item>
        <a-form-item label="Instagram URL">
          <a-input v-model:value="form.instagram" size="large" :disabled="isDemo">
            <template #prefix
              ><LucideIcon name="Instagram" :size="16" class="mr-2 text-pink-500"
            /></template>
          </a-input>
        </a-form-item>
        <a-form-item label="LinkedIn URL">
          <a-input v-model:value="form.linkedin" size="large" :disabled="isDemo">
            <template #prefix
              ><LucideIcon name="Linkedin" :size="16" class="mr-2 text-blue-700"
            /></template>
          </a-input>
        </a-form-item>
      </div>
      <div
        class="flex flex-col items-end mt-12 border-t pt-8"
        :class="themeStore.isDark ? 'border-gray-800' : 'border-gray-100'"
      >
        <a-alert
          v-if="isDemo"
          message="Demo Mode Active"
          description="Branding social connections are locked in this demonstration."
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
          Save Social Links
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
