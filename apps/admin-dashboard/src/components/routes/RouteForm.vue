<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { stopService } from '@/services/stop.service'
import { useThemeStore } from '@/stores/theme'
import { VueDraggable } from 'vue-draggable-plus'

const themeStore = useThemeStore()

const props = defineProps({
  initialValues: {
    type: Object,
    default: () => ({
      title: '',
      stops: [],
      status: true,
    }),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
  hideActions: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit', 'cancel'])

const formRef = ref(null)
const formState = reactive({
  title: '',
  stops: [], // Array of { stopId, order, price_per_km, minimum_fare, distance }
  status: true,
})

const allStops = ref([])
const fetchingStops = ref(false)

onMounted(async () => {
  // Sync initial values
  if (props.initialValues) {
    formState.title = props.initialValues.title || ''
    formState.status = props.initialValues.status !== undefined ? props.initialValues.status : true
    formState.stops = props.initialValues.stops ? [...props.initialValues.stops] : []
  }

  // Fetch all stops for selection
  await fetchAllStops()
})

const stopCache = new Map()

const fetchAllStops = async (search = '') => {
  fetchingStops.value = true
  try {
    const response = await stopService.fetchStop(search)
    const items = response.items || []
    
    // Maintain a cache of stops to ensure labels stay visible for selected items
    items.forEach(item => {
      if (item.value) stopCache.set(item.value, item)
    })
    
    // Combine search results with currently selected stops from the cache
    const selectedIds = new Set(formState.stops.map(s => s.stopId).filter(Boolean))
    const currentOptions = [...items]
    
    selectedIds.forEach(id => {
      const isPresent = currentOptions.some(opt => opt.value === id)
      if (!isPresent && stopCache.has(id)) {
        currentOptions.push(stopCache.get(id))
      }
    })
    
    allStops.value = currentOptions
  } catch (error) {
    console.error('Failed to fetch stops:', error)
  } finally {
    fetchingStops.value = false
  }
}

let searchTimeout = null
const handleStopSearch = (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchAllStops(val)
  }, 500)
}

const addStop = () => {
  formState.stops.push({
    stopId: undefined,
    order: formState.stops.length + 1,
    price_per_km_pickup: 0,
    price_per_km_drop:0,
    minimum_fare_pickup: 0,
    minimum_fare_drop: 0,
    distance: 0,
  })
}

const removeStop = (index) => {
  formState.stops.splice(index, 1)
  // Re-calculate orders
  formState.stops.forEach((stop, i) => {
    stop.order = i + 1
  })
}

const moveUp = (index) => {
  if (index === 0) return
  const temp = formState.stops[index]
  formState.stops[index] = formState.stops[index - 1]
  formState.stops[index - 1] = temp
  handleSort()
}

const handleSort = () => {
  formState.stops.forEach((stop, i) => {
    stop.order = i + 1
  })
}

const moveDown = (index) => {
  if (index === formState.stops.length - 1) return
  const temp = formState.stops[index]
  formState.stops[index] = formState.stops[index + 1]
  formState.stops[index + 1] = temp
  handleSort()
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    // Filter out invalid stops
    const validStops = formState.stops.filter(s => s.stopId)
    
    emit('submit', {
      ...formState,
      stops: validStops
    })
  } catch (error) {
    console.error('Validation failed:', error)
  }
}

const rules = {
  title: [{ required: true, message: 'Please input route title' }],
}

defineExpose({
  submit: handleSubmit,
})
</script>

<template>
  <a-form
    ref="formRef"
    :model="formState"
    :rules="rules"
    layout="vertical"
    class="space-y-6"
  >
    <div
      class="p-4 rounded-2xl border transition-colors duration-300 mb-6"
      :class="themeStore.isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
        <a-form-item label="Route Title" name="title">
          <a-input
            v-model:value="formState.title"
            placeholder="e.g. Campus to Downtown"
            class="rounded-lg h-10"
            :disabled="disabled"
          />
        </a-form-item>

        <a-form-item label="Route Status" name="status">
          <div class="flex items-center h-12">
            <a-switch
              v-model:checked="formState.status"
              checked-children="Active"
              un-checked-children="Inactive"
              :disabled="disabled"
            />
            <span class="ml-3 text-gray-500 text-sm">{{
              formState.status ? 'Route is visible for bookings' : 'Route is hidden'
            }}</span>
          </div>
        </a-form-item>
      </div>
    </div>

    <div class="flex items-center justify-between px-2 mb-4">
      <div>
        <h3 
          class="text-lg font-bold m-0 transition-colors duration-300"
          :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
        >
          Route Stops
        </h3>
        <p class="text-gray-500 text-xs m-0">Add and arrange stops in chronological order</p>
      </div>
      <a-button type="primary" class="rounded-xl flex items-center gap-2" @click="addStop" :disabled="disabled">
        <LucideIcon name="PlusCircle" :size="18" />
        Add Stop
      </a-button>
    </div>

    <div class="space-y-4">
      <div 
        v-if="formState.stops.length === 0" 
        class="rounded-3xl p-12 text-center border-2 border-dashed transition-colors duration-300"
        :class="themeStore.isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'"
      >
        <LucideIcon name="MapPin" :size="48" class="text-gray-300 mx-auto mb-4" />
        <p class="text-gray-400">No stops added yet. Click "Add Stop" to begin building your route.</p>
      </div>

      <VueDraggable
        v-model="formState.stops"
        :animation="150"
        handle=".drag-handle"
        class="space-y-4"
        :disabled="disabled"
        @end="handleSort"
      >
        <div v-for="(stop, index) in formState.stops" :key="index" 
          class="p-4 rounded-3xl border shadow-sm flex flex-col gap-6 group relative transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-100 hover:border-blue-100 hover:shadow-md'"
        >
          <div class="flex items-center gap-4">
            <div class="flex flex-col items-center gap-1">
              <div class="drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                <LucideIcon name="GripVertical" :size="24" class="text-gray-400" />
              </div>
              <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs ring-4 ring-blue-50/50">
                {{ index + 1 }}
              </div>
            </div>

            <div class="flex-1">
              <a-form-item :label="`Stop ${index + 1}`" class="mb-0">
                <a-select
                    size="large"
                  v-model:value="stop.stopId"
                  show-search
                  allowClear
                  placeholder="Type to search stops..."
                  class="w-full custom-select rounded-lg h-10"
                  :filter-option="false"
                  :loading="fetchingStops"
                  :options="allStops"
                  :disabled="disabled"
                  @search="handleStopSearch"
                >
                  <template #option="{ label, landmark }">
                    <div class="flex flex-col py-0.5">
                      <span class="font-bold text-gray-800">{{ label }}</span>
                      <span v-if="landmark" class="text-[10px] text-gray-400 flex items-center gap-1">
                        <LucideIcon name="MapPin" :size="10" /> {{ landmark }}
                      </span>
                    </div>
                  </template>
                  <template #suffixIcon><LucideIcon name="MapPin" :size="14" class="text-gray-400" /></template>
                </a-select>
              </a-form-item>
            </div>

            <div class="flex flex-col gap-2">
              <a-button type="text" size="small" :disabled="index === 0 || disabled" @click="moveUp(index)" class="h-8 w-8 p-0 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <LucideIcon name="ChevronUp" :size="16" />
              </a-button>
              <a-button type="text" size="small" :disabled="index === formState.stops.length - 1 || disabled" @click="moveDown(index)" class="h-8 w-8 p-0 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <LucideIcon name="ChevronDown" :size="16" />
              </a-button>
            </div>

            <a-button type="text" danger class="rounded-xl h-10 w-10 p-0 flex items-center justify-center hover:bg-red-50 mt-1" @click="removeStop(index)" :disabled="disabled">
              <LucideIcon name="Trash2" :size="18" />
            </a-button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pl-12">
     

            <a-form-item label="Price/KM Pickup" class="mb-0">
              <a-input-number
                v-model:value="stop.price_per_km_pickup"
                placeholder="0.00"
                class="w-full custom-input-number"
                :min="0"
                :precision="2"
                :disabled="disabled"
              />
            </a-form-item>

            <a-form-item label="Price/KM Drop" class="mb-0">
              <a-input-number
                v-model:value="stop.price_per_km_drop"
                placeholder="0.00"
                class="w-full custom-input-number"
                :min="0"
                :precision="2"
                :disabled="disabled"
              />
            </a-form-item>

            <a-form-item label="Min Fare Pickup" class="mb-0">
              <a-input-number
                v-model:value="stop.minimum_fare_pickup"
                placeholder="0.00"
                class="w-full custom-input-number"
                :min="0"
                :precision="2"
                :disabled="disabled"
              />
            </a-form-item>
            <a-form-item label="Min Fare Drop" class="mb-0">
              <a-input-number
                v-model:value="stop.minimum_fare_drop"
                placeholder="0.00"
                class="w-full custom-input-number"
                :min="0"
                :precision="2"
                :disabled="disabled"
              />
            </a-form-item>
                   <a-form-item label="Dist (KM)" class="mb-0">
              <a-input-number
                v-model:value="stop.distance"
                placeholder="0.00"
                class="w-full custom-input-number"
                :min="0"
                :precision="2"
                :disabled="disabled"
              />
            </a-form-item>
          </div>
        </div>
      </VueDraggable>

      <!-- Bottom Add Stop Area -->
      <div 
        v-if="formState.stops.length > 0"
        class="mt-4 p-4 rounded-3xl border-2 border-dashed flex justify-center items-center cursor-pointer transition-all duration-300 group hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
        :class="[
          themeStore.isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50',
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        ]"
        @click="addStop"
      >
        <div class="flex items-center gap-2 text-gray-500 group-hover:text-blue-600 transition-colors font-semibold text-sm">
          <LucideIcon name="PlusCircle" :size="20" />
          Add Another Stop
        </div>
      </div>
    </div>

    <div v-if="!hideActions" class="flex justify-end gap-3 pt-6">
      <a-button size="large" class="rounded-xl px-8" @click="$emit('cancel')">Cancel</a-button>
      <a-button
        type="primary"
        size="large"
        class="rounded-xl px-8 bg-blue-600 shadow-lg shadow-blue-100"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ isEdit ? 'Update Route' : 'Create Route' }}
      </a-button>
    </div>
  </a-form>
</template>

<style scoped>
 @reference "tailwindcss";

 

:where(.dark) .custom-select :deep(.ant-select-selector),
:where(.dark) .custom-input-number {
  border-color: #374151 !important;
  background-color: #1f2937 !important;
}



:deep(.ant-form-item-label > label) {
  @apply text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0;
}

.group:hover .w-8 {
  @apply bg-blue-600 text-white transition-colors duration-300;
}

:deep(.ant-select-selector),
:deep(.ant-input-number),
:deep(.ant-input),
:deep(.ant-picker) {
  border-radius: var(--radius-base) !important;
}

:deep(.ant-card) {
  border-radius: var(--radius-premium) !important;
}
</style>
