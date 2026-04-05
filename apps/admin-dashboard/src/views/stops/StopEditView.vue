<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import StopForm from '@/components/stops/StopForm.vue'
import { useStop } from '@/composables/useStop'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import LucideIcon from '@/components/LucideIcon.vue'

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const authStore = useAuthStore()
const isDemo = computed(() => authStore.isDemo)
const { updateStop, getStopById } = useStop()
const formRef = ref(null)
const loading = ref(false)
const fetching = ref(false)
const initialData = ref(null)
const stopId = route.params.id

const fetchStopData = async () => {
  fetching.value = true
  try {
    const response = await getStopById(stopId)
    initialData.value = response.data || response
  } catch (error) {
    message.error('Failed to load stop data')
    router.push({ name: 'stop-list' })
  } finally {
    fetching.value = false
  }
}

const handleSubmit = async (formData) => {
  if (isDemo.value) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating stop details is disabled in Demo Mode.',
    })
    return
  }
  loading.value = true
  try {
    const response = await updateStop(stopId, formData)
    if (response.status || response.success) {
      message.success('Stop updated successfully')
      router.push({ name: 'stop-list' })
    } else {
      message.error(response.message || 'Failed to update stop')
    }
  } catch (error) {
    message.error('Failed to update stop')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'stops' })
}

const submitForm = () => {
  formRef.value?.submit()
}

onMounted(() => {
  fetchStopData()
})
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
            Edit Stop
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Update the details for the selected location
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
          :disabled="isDemo"
          @click="submitForm"
        >
          Update Stop
        </a-button>
      </div>
    </div>

    <!-- Form Section -->
    <div
      class="p-8 border shadow-sm transition-colors duration-300 relative"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
      :style="{ borderRadius: 'var(--radius-premium)' }"
    >
      <!-- Demo Mode Alert -->
      <a-alert
        v-if="isDemo"
        message="Demo Mode Active"
        description="Stop details can be viewed but modifications are disabled in this demonstration."
        type="warning"
        show-icon
        class="mb-6 rounded-xl"
      />

      <div
        v-if="fetching"
        class="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-3xl"
      >
        <a-spin size="large" />
      </div>
      <StopForm
        v-if="initialData"
        ref="formRef"
        :initialData="initialData"
        @submit="handleSubmit"
        :loading="loading"
        :disabled="isDemo"
        is-edit
        hide-actions
      />
    </div>
  </div>
</template>
