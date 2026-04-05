<template>
  <a-form :model="formState" layout="vertical" ref="formRef" :rules="rules">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Route Selection -->
      <a-form-item label="Route" name="routeId">
        <a-select
          v-model:value="formState.routeId"
          placeholder="Select Route"
          :loading="loadingRoutes"
          show-search
          allowClear
          :filter-option="false"
          :disabled="disabled"
          @search="handleRouteSearch"
          @change="handleRouteChange"
        >
          <a-select-option v-for="route in routes" :key="route.value" :value="route.value">
            {{ route.label }} ({{ route.totalStops }} stops)
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- Bus Selection -->
      <a-form-item label="Bus" name="busId">
        <a-select
          allowClear
          v-model:value="formState.busId"
          placeholder="Select Bus"
          :loading="loadingBuses"
          show-search
          option-filter-prop="label"
          :disabled="disabled"
        >
          <a-select-option
            v-for="bus in buses"
            :key="bus.value"
            :value="bus.value"
            :label="bus.label"
          >
            {{ bus.label }} ({{ bus.max_seats }} seats)
          </a-select-option>
        </a-select>
      </a-form-item>
    </div>

    <!-- Stops Time Configuration -->
    <div v-if="loadingStops || formState.stops.length > 0" class="mt-6">
      <h3 class="text-lg font-medium mb-4">Stops Schedule</h3>
      <div v-if="loadingStops" class="space-y-4">
        <div
          v-for="i in 3"
          :key="i"
          class="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
        >
          <div class="flex items-center justify-between mb-4">
            <a-skeleton-button active size="small" class="w-32" />
            <a-skeleton-button active size="small" class="w-16" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <a-skeleton-input active class="w-full" />
            </div>
            <div class="space-y-2">
              <div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <a-skeleton-input active class="w-full" />
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        v-for="(stop, index) in formState.stops"
        :key="index"
        class="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="font-semibold text-gray-700 dark:text-gray-300">{{ stop.stop_name }}</span>
          <a-tag v-if="index === 0" color="green">Origin</a-tag>
          <a-tag v-else-if="index === formState.stops.length - 1" color="orange">Destination</a-tag>
          <a-tag v-else color="blue">Stop</a-tag>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Arrival Time (not for origin) -->
          <a-form-item v-if="index !== 0" label="Arrival Time" class="mb-0">
            <a-time-picker
              v-model:value="stop.arrival_time"
              format="HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
              placeholder="Select arrival time"
              class="w-full"
              :disabled="disabled"
            />
          </a-form-item>

          <!-- Departure Time (not for destination) -->
          <a-form-item
            v-if="index !== formState.stops.length - 1"
            label="Departure Time"
            class="mb-0"
          >
            <a-time-picker
              v-model:value="stop.departure_time"
              format="HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
              placeholder="Select departure time"
              class="w-full"
              :disabled="disabled"
            />
          </a-form-item>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <!-- Days Selection -->
      <a-form-item label="Operating Days" name="every" class="col-span-2">
        <a-checkbox-group v-model:value="formState.every" :options="dayOptions" :disabled="disabled" />
      </a-form-item>

      <!-- Operation Period -->
      <a-form-item label="Operation Period" name="period" class="col-span-2">
        <a-range-picker
          v-model:value="operationPeriod"
          format="YYYY-MM-DD"
          class="w-full"
          :disabled="disabled"
          @change="handlePeriodChange"
        />
      </a-form-item>

      <!-- Status -->

      <a-form-item label="Status" name="status">
        <a-segmented
          v-model:value="formState.status"
          :options="[
            { label: 'Active', value: true },
            { label: 'Inactive', value: false },
          ]"
          :disabled="disabled"
        />
      </a-form-item>
    </div>
  </a-form>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { routeService } from '@/services/route.service'
import { busService } from '@/services/bus.service'
import dayjs from 'dayjs'
import lodash from 'lodash'
import { timeToMinutes, minutesToDayjs } from '@/utils/time'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const props = defineProps({
  record: { type: Object, default: null },
  isEdit: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit'])

const formRef = ref(null)
const routes = ref([])
const buses = ref([])
const loadingRoutes = ref(false)
const loadingBuses = ref(false)
const loadingStops = ref(false)
const operationPeriod = ref([])

const dayOptions = [
  { label: 'Sunday', value: 'sunday' },
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
]

const formState = reactive({
  routeId: null,
  busId: null,
  stops: [],
  every: [],
  start_date: '',
  end_date: '',
  status: true,
  departure_time: '',
  arrival_time: '',
})

const rules = {
  routeId: [{ required: true, message: 'Please select a route' }],
  busId: [{ required: true, message: 'Please select a bus' }],
  every: [{ required: true, type: 'array', message: 'Please select operating days' }],
  status: [{ required: true, message: 'Please select status' }],
}

const fetchData = async () => {
  try {
    loadingBuses.value = true
    loadingRoutes.value = true
    const [busesRes, routesRes] = await Promise.all([busService.getLists(), routeService.getList()])
    buses.value = busesRes.items
    routes.value = routesRes.items
  } catch (error) {
    console.error('Error fetching initial data:', error)
  } finally {
    loadingBuses.value = false
    loadingRoutes.value = false
  }
}

const handleRouteSearch = lodash.debounce(async (searchValue) => {
  if (!searchValue) return
  loadingRoutes.value = true
  try {
    const res = await routeService.getList(searchValue)
    routes.value = res.items
  } catch (error) {
    console.error('Error searching routes:', error)
  } finally {
    loadingRoutes.value = false
  }
}, 300)

const handleRouteChange = async (routeId) => {
  if (!routeId) {
    formState.stops = []
    return
  }
  loadingStops.value = true
  try {
    const res = await routeService.getStops(routeId)
    if (res.status && res.data) {
      formState.stops = res.data.map((stop) => ({
        ...stop,
        arrival_time: null,
        departure_time: null,
      }))
    }
  } catch (error) {
    console.error('Error fetching stops:', error)
  } finally {
    loadingStops.value = false
  }
}

const handlePeriodChange = (dates) => {
  if (dates && dates.length === 2) {
    formState.start_date = dates[0].format('YYYY-MM-DD')
    formState.end_date = dates[1].format('YYYY-MM-DD')
  } else {
    formState.start_date = ''
    formState.end_date = ''
  }
}

watch(
  () => props.record,
  async (newRecord) => {
    if (newRecord) {
      Object.assign(formState, {
        routeId:
          newRecord.routeId || newRecord.route_id || newRecord.route?.ids || newRecord.route?.id,
        busId: newRecord.busId || newRecord.bus_id || newRecord.bus?.ids || newRecord.bus?.id,
        every: newRecord.every || [],
        status: newRecord.status === 'Active' || newRecord.status === true,
        start_date: newRecord.start_date,
        end_date: newRecord.end_date,
        stops: (newRecord.stops || []).map((s) => ({
          ...s,
          arrival_time:
            s.arrival_time !== undefined && s.arrival_time !== null
              ? minutesToDayjs(s.arrival_time)
              : null,
          departure_time:
            s.departure_time !== undefined && s.departure_time !== null
              ? minutesToDayjs(s.departure_time)
              : null,
        })),
      })

      if (!routes.value.find((r) => r.value === formState.routeId)) {
        routes.value = [
          {
            label: newRecord.routeName || newRecord.route_name || newRecord.route?.title,
            value: formState.routeId,
          },
        ]
      }

      if (newRecord.start_date && newRecord.end_date) {
        operationPeriod.value = [dayjs(newRecord.start_date), dayjs(newRecord.end_date)]
      }
    } else {
      // Default dates
      const start = dayjs()
      const end = dayjs().add(1, 'month')
      operationPeriod.value = [start, end]
      formState.start_date = start.format('YYYY-MM-DD')
      formState.end_date = end.format('YYYY-MM-DD')
    }
  },
  { immediate: true },
)

const handleSubmit = async () => {
  try {
    await formRef.value.validate()

    const submitData = {
      ...formState,
      stops: formState.stops.map((stop) => ({
        ...stop,
        arrival_time: timeToMinutes(stop.arrival_time),
        departure_time: timeToMinutes(stop.departure_time),
      })),
    }

    // Set departure/arrival time for the main record from first/last stop
    if (submitData.stops.length > 0) {
      submitData.departure_time = submitData.stops[0].departure_time
      submitData.arrival_time = submitData.stops[submitData.stops.length - 1].arrival_time
    }

    emit('submit', submitData)
  } catch (error) {
    console.log('Validation Error:', error)
  }
}

onMounted(() => {
  fetchData()
})

defineExpose({
  submit: handleSubmit,
})
</script>
<style scoped>
@reference "tailwindcss";

:deep(.ant-select-selector),
:deep(.ant-picker),
:deep(.ant-input-number),
:deep(.ant-input) {
  border-radius: var(--radius-base) !important;
}

:deep(.ant-card) {
  border-radius: var(--radius-premium) !important;
}
</style>
