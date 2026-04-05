<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { busScheduleService } from '@/services/busschedule.service'
import { driverService } from '@/services/driver.service'
import { tripAssignService } from '@/services/tripassign.service'
import { useThemeStore } from '@/stores/theme'
import LucideIcon from '@/components/LucideIcon.vue'
import dayjs from 'dayjs'
import lodash from 'lodash'
import { minutesToTime } from '@/utils/time'
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue'

const tripStatuses = ['ASSIGNED', 'EXPIRED', 'STARTED', 'COMPLETED', 'NOTSTARTED', 'RIDING']

const props = defineProps({
  record: { type: Object, default: null },
  isEdit: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit'])

const themeStore = useThemeStore()
const formRef = ref(null)
const loadingSchedules = ref(false)
const loadingDrivers = ref(false)
const loadingAssistants = ref(false)

const schedules = ref([])
const drivers = ref([])
const assistants = ref([])

const formState = reactive({
  busScheduleId: null, // This stores the schedule object or ID
  driverId: null,
  routeId: null,
  assistantId: null,
  dates: [],
  trip_status: null,
})



// ... existing imports

const checkAvailability = async () => {
  // We need at least dates and a driver or schedule to check
  if (!formState.dates.length) return Promise.resolve()
  if (!formState.driverId && !formState.busScheduleId) return Promise.resolve()

  try {
    const payload = {
      driverId: formState.driverId,
      busScheduleId: formState.busScheduleId,
      dates: formState.dates,
      excludeId: props.isEdit && props.record ? props.record.id || props.record._id : undefined
    }
    
    // Check key fields have values before calling API to avoid unnecessary 400s
    if (!payload.driverId || !payload.busScheduleId) return Promise.resolve()

    const { status, message: msg } = await tripAssignService.checkAvailability(payload)
    if (status) {
      return Promise.reject(msg || 'This schedule or driver is already booked for the selected dates.')
    }
    return Promise.resolve()
  } catch (error) {
    console.error('Availability check failed:', error)
    // Fail safe: if API fails, do we block? 
    // Usually better to warn. For now, let's resolve but log.
    return Promise.resolve()
  }
}

const rules = {
  busScheduleId: [
    { required: true, message: 'Please select a bus schedule' },
    { validator: checkAvailability, trigger: 'change' }
  ],
  driverId: [
    { required: true, message: 'Please select a driver' },
    { validator: checkAvailability, trigger: 'change' }
  ],
  assistantId: [{ required: true, message: 'Please select an assistant' }],
  dates: [
    { required: true, type: 'array', min: 1, message: 'Please select at least one date' },
    { validator: checkAvailability, trigger: 'change' }
  ],
}

// Fetch Initial Data
const fetchInitialData = async () => {
  try {
    loadingSchedules.value = true
    const res = await busScheduleService.getLists()
    schedules.value = res.data || []

    // Initial load for drivers and assistants
    await Promise.all([fetchDrivers(''), fetchAssistants('')])
  } catch (error) {
    console.error('Error fetching initial data:', error)
  } finally {
    loadingSchedules.value = false
  }
}

// Search Functions
const handleScheduleSearch = lodash.debounce(async (val) => {
  // If the API supports search for schedules
}, 300)

const fetchDrivers = async (search) => {
  loadingDrivers.value = true
  try {
    const res = await driverService.getList({ type: 'driver', search })
    drivers.value = res.items || []
  } catch (error) {
    console.error('Error fetching drivers:', error)
  } finally {
    loadingDrivers.value = false
  }
}

const fetchAssistants = async (search) => {
  loadingAssistants.value = true
  try {
    const res = await driverService.getList({ type: 'assistant', search })
    assistants.value = res.items || []
  } catch (error) {
    console.error('Error fetching assistants:', error)
  } finally {
    loadingAssistants.value = false
  }
}

const debouncedFetchDrivers = lodash.debounce(fetchDrivers, 300)
const debouncedFetchAssistants = lodash.debounce(fetchAssistants, 300)

// Date Helpers
const formatDisplayDate = (date) => {
  if (!date) return ''
  const authStore = useAuthStore()
  const format = authStore.generalSettings?.date_format || 'YYYY-MM-DD'
  return dayjs(date).format(format)
}

const handleDateAdd = (date, dateString) => {
  if (dateString && !formState.dates.includes(dateString)) {
    formState.dates.push(dateString)
    // Trigger validation to clear error message
    formRef.value?.validateFields(['dates']).catch(() => {})
  }
}

const removeDate = (index) => {
  formState.dates.splice(index, 1)
  // Trigger validation to show error if no dates remain
  formRef.value?.validateFields(['dates']).catch(() => {})
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    const payload = {
      ...formState,
      routeId: schedules.value.find((s) => s.id === formState.busScheduleId)?.routeId,
      // Map back to what service expects if needed
    }
    emit('submit', payload)
  } catch (error) {
    console.error('Validation failed:', error)
  }
}

watch(
  () => props.record,
  (newRecord) => {
    if (newRecord) {
      Object.assign(formState, {
        busScheduleId: newRecord.busScheduleId || newRecord.busScheduleId,
        driverId: newRecord.driverId || newRecord.driverId,
        assistantId: newRecord.assistantId || newRecord.assistantId,
        dates: newRecord.dates || [],
        trip_status: newRecord.trip_status || 'ASSIGNED',
      })
    }
  },
  { immediate: true },
)

onMounted(() => {
  fetchInitialData()
})

defineExpose({ submit: handleSubmit })
</script>

<template>
  <a-form :model="formState" layout="vertical" ref="formRef" :rules="rules">
    <div class="space-y-6">
      <!-- Bus Schedule Selection -->
      <a-form-item label="Bus Schedule" name="busScheduleId">
        <a-select
          v-model:value="formState.busScheduleId"
          placeholder="Select a bus schedule"
          show-search
          allowClear
          :loading="loadingSchedules"
          option-label-prop="label"
          :disabled="disabled"
        >
          <a-select-option
            v-for="item in schedules"
            :key="item.id"
            :value="item.id"
            :label="item.route_name"
          >
            <div class="flex flex-col py-1">
              <span class="font-medium">{{ item.route_name }}</span>
              <span class="text-xs text-gray-500">
                {{ item.departure_time }} - {{ item.arrival_time }}
              </span>
            </div>
          </a-select-option>
        </a-select>
      </a-form-item>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Driver Selection -->
        <a-form-item label="Driver" name="driverId">
          <a-select
            v-model:value="formState.driverId"
            show-search
            allowClear
            placeholder="Search by name or phone..."
            :loading="loadingDrivers"
            :filter-option="false"
            :disabled="disabled"
            @search="debouncedFetchDrivers"
          >
            <a-select-option v-for="d in drivers" :key="d.id" :value="d.id">
              <div class="flex items-center gap-2">
                <a-avatar :src="d.picture" size="small" />
                <span>{{ d.firstname }} {{ d.lastname }} (+{{ d.phone }})</span>
              </div>
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- Assistant Selection -->
        <a-form-item label="Assistant" name="assistantId">
          <a-select
            allowClear
            v-model:value="formState.assistantId"
            show-search
            placeholder="Search by name or phone..."
            :loading="loadingAssistants"
            :filter-option="false"
            :disabled="disabled"
            @search="debouncedFetchAssistants"
          >
            <a-select-option v-for="a in assistants" :key="a.id" :value="a.id">
              <div class="flex items-center gap-2">
                <a-avatar :src="a.picture" size="small" />
                <span>{{ a.firstname }} {{ a.lastname }} (+{{ a.phone }})</span>
              </div>
            </a-select-option>
          </a-select>
        </a-form-item>
      </div>

      <!-- Dates Selection -->
      <a-form-item label="Trip Dates" name="dates">
        <div class="space-y-4">
          <a-date-picker
            class="w-full"
            @change="handleDateAdd"
            placeholder="Select date to add"
            value-format="YYYY-MM-DD"
            :disabled="disabled"
          />
          <div
            v-if="formState.dates.length > 0"
            class="flex flex-wrap gap-2 p-4 rounded-2xl border"
            :class="
              themeStore.isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'
            "
          >
            <a-tag
              v-for="(date, index) in formState.dates"
              :key="date"
              :closable="!disabled"
              color="blue"
              @close="removeDate(index)"
              class="rounded-full px-3 py-1 flex items-center gap-1"
            >
              {{ formatDisplayDate(date) }}
            </a-tag>
          </div>

          <a-empty v-else description="No dates selected" />
        </div>
      </a-form-item>

      <!-- Status Selection (Edit Mode Only) -->
      <a-form-item v-if="isEdit" label="Trip Status" name="trip_status">
        <a-select v-model:value="formState.trip_status" placeholder="Select status" :disabled="disabled">
          <a-select-option v-for="status in tripStatuses" :key="status" :value="status">
            {{ status }}
          </a-select-option>
        </a-select>
      </a-form-item>
    </div>
  </a-form>
</template>

<style scoped>
@reference "tailwindcss";

:deep(.ant-select-selector),
:deep(.ant-picker) {
  border-radius: var(--radius-base) !important;
}

:deep(.ant-card) {
  border-radius: var(--radius-premium) !important;
}
</style>
