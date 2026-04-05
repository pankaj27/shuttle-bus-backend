<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import LucideIcon from '@/components/LucideIcon.vue'
import BusScheduleForm from './components/BusScheduleForm.vue'
import { useBusSchedule } from '@/composables/useBusSchedule'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const authStore = useAuthStore()
const { getBusScheduleById, updateBusSchedule } = useBusSchedule()
const formRef = ref(null)

const isDemo = computed(() => authStore.isDemo)
const loading = ref(false)
const fetching = ref(false)
const record = ref(null)

const fetchRecord = async () => {
  fetching.value = true
  try {
    const res = await getBusScheduleById(route.params.id)
    record.value = res.data || res
  } catch (error) {
    message.error('Failed to fetch schedule details')
    router.push({ name: 'bus-schedule-list' })
  } finally {
    fetching.value = false
  }
}

const handleFormSubmit = async (formData) => {
  if (isDemo.value) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating schedule details is disabled in Demo Mode.',
    });
    return;
  }
  loading.value = true
  try {
    await updateBusSchedule(route.params.id, formData)
    message.success('Bus schedule updated successfully')
    router.push({ name: 'bus-schedule-list' })
  } catch (error) {
    message.error(error.response?.data?.message || 'Failed to update bus schedule')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'bus-schedule-list' })
}

const submitForm = () => {
  formRef.value?.submit()
}

onMounted(fetchRecord)
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-12">
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
          <LucideIcon name="CalendarClock" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Edit Bus Schedule
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Update bus timetable and route schedule
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
          Update Schedule
        </a-button>
      </div>
    </div>

    <!-- Demo Mode Alert -->
    <a-alert
      v-if="isDemo"
      message="Demo Mode Active"
      description="Schedule details can be viewed but modifications are disabled."
      type="warning"
      show-icon
      class="rounded-xl mb-6 shadow-sm ring-1 ring-amber-100"
    />

    <!-- Form Card -->
    <div
      class="p-8 rounded-3xl border shadow-sm transition-colors duration-300 relative"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
    >
      <div v-if="fetching" class="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-3xl">
        <a-spin size="large" />
      </div>
      <BusScheduleForm v-if="record" ref="formRef" :record="record" :is-edit="true" :disabled="isDemo" @submit="handleFormSubmit" />
    </div>
  </div>
</template>
