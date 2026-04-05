<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import TripAssignForm from './components/TripAssignForm.vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { tripAssignService } from '@/services/tripassign.service'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const themeStore = useThemeStore()
const formRef = ref(null)
const loading = ref(false)

const handleSubmit = async (formData) => {
  loading.value = true
  try {
    await tripAssignService.create(formData)
    message.success('Trip assignment created successfully')
    router.push({ name: 'trips-list' })
  } catch (error) {
    message.error(error.response?.data?.message || 'Failed to create trip assignment')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'trips-list' })
}

const submitForm = () => {
  formRef.value?.submit()
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div
      class="sticky top-0 z-40 flex justify-between items-center p-6 rounded-3xl border shadow-sm transition-colors duration-300"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
    >
      <div class="flex items-center gap-4">
        <div
          class="p-3 rounded-2xl transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'"
        >
          <LucideIcon name="CalendarPlus" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Create Trip Assignment
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Assign a driver and assistant to a specific bus schedule
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
          Save Assignment
        </a-button>
      </div>
    </div>

    <!-- Form Card -->
    <div
      class="p-8 rounded-3xl border shadow-sm transition-colors duration-300"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
    >
      <TripAssignForm ref="formRef" @submit="handleSubmit" />
    </div>
  </div>
</template>
