<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import StopForm from '@/components/stops/StopForm.vue'
import { useStop } from '@/composables/useStop'
import { useThemeStore } from '@/stores/theme'
import LucideIcon from '@/components/LucideIcon.vue'

const router = useRouter()
const themeStore = useThemeStore()
const { createStop } = useStop()
const formRef = ref(null)
const loading = ref(false)

const handleSubmit = async (formData) => {
  loading.value = true
  try {
    await createStop(formData)
    message.success('Stop created successfully')
    router.push({ name: 'stop-list' })
  } catch (error) {
    message.error('Failed to create stop')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'stop-list' })
}

const submitForm = () => {
  formRef.value?.submit()
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div
      class="sticky top-0 z-40 flex justify-between items-center p-4 border shadow-md transition-all duration-300 backdrop-blur-md"
      :class="themeStore.isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-100'"
      :style="{ borderRadius: 'var(--radius-premium)' }"
    >
      <div class="flex items-center gap-4">
        <div
          class="p-3 rounded-2xl transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'"
        >
          <LucideIcon name="MapPin" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Create New Stop
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Add a new location or bus stop to the system
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <a-button size="large" @click="handleCancel" class="rounded-xl border-gray-200">
          Cancel
        </a-button>
        <a-button
          type="primary"
          size="large"
          class="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl px-8"
          :loading="loading"
          @click="submitForm"
        >
          Create Stop
        </a-button>
      </div>
    </div>

    <!-- Form Section -->
    <div
      class="p-8 border shadow-sm transition-colors duration-300 relative"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
      :style="{ borderRadius: 'var(--radius-premium)' }"
    >
      <StopForm ref="formRef" @submit="handleSubmit" :loading="loading" :is-edit="false" hide-actions />
    </div>
  </div>
</template>
