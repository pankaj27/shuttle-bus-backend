<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import stopIcon from '@/assets/images/stops/stop.svg'

const authStore = useAuthStore()

const props = defineProps({
  isEdit: Boolean,
  loading: Boolean,
  initialData: Object,
  disabled: Boolean,
  hideActions: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit'])
const themeStore = useThemeStore()
const formRef = ref(null)

const formState = reactive({
  title: '',
  landmark: '',
  lat: null,
  lng: null,
  type: 'pickup', // or common/dropout etc as per backend
  status: true,
})

const rules = {
  title: [{ required: true, message: 'Please enter stop title' }],
  lat: [{ required: true, message: 'Please enter latitude' }],
  lng: [{ required: true, message: 'Please enter longitude' }],
}

// Map Refs & Logic
const center = ref([0, 0]) // Start at 0,0
const zoom = ref(2) // Start zoomed out
const projection = ref('EPSG:4326')
const viewRef = ref(null)


const onMapClick = (event) => {
  if (props.disabled) return
  const coords = event.coordinate
  formState.lng = parseFloat(coords[0].toFixed(6))
  formState.lat = parseFloat(coords[1].toFixed(6))
}

const getCurrentLocation = (silent = false) => {
  if (props.disabled) return
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        formState.lat = parseFloat(position.coords.latitude.toFixed(6))
        formState.lng = parseFloat(position.coords.longitude.toFixed(6))
        center.value = [formState.lng, formState.lat]
        zoom.value = 16
        if (!silent) message.success('Location updated to current position')
      },
      () => {
        if (!silent) message.error('Unable to retrieve your location')
        // No longer falling back to Kathmandu
      },
    )
  } else {
    if (!silent) message.error('Geolocation is not supported by your browser')
    // No longer falling back to Kathmandu
  }
}

// Watch for coordinate changes to animate map
watch(
  [() => formState.lat, () => formState.lng],
  ([newLat, newLng]) => {
    if (newLat && newLng && viewRef.value?.view) {
      viewRef.value.view.animate({
        center: [newLng, newLat],
        duration: 800,
        zoom: 16,
      })
    }
  },
  { deep: true },
)

onMounted(() => {
  if (props.initialData) {
    Object.keys(formState).forEach((key) => {
      if (props.initialData[key] !== undefined) {
        formState[key] = props.initialData[key]
      }
    })

    if (formState.lat && formState.lng) {
      center.value = [formState.lng, formState.lat]
      zoom.value = 16
    }
  } else {
    // If no initial data (create mode), try to get current location silently
    getCurrentLocation(true)
  }
})

const onFinish = () => {
  emit('submit', { ...formState })
}

defineExpose({
  submit: onFinish,
})
</script>

<template>
  <a-form
    :model="formState"
    layout="vertical"
    @finish="onFinish"
    :rules="rules"
    ref="formRef"
    class="stop-form"
    :class="{ dark: themeStore.isDark }"
  >
    <a-row :gutter="[24, 24]">
      <!-- Left Column: Form Details -->
      <a-col :xs="24" :lg="10">
        <div class="flex flex-col gap-6">
          <!-- Basic Details -->
          <a-card :bordered="false" class="shadow-sm rounded-2xl overflow-hidden">
            <template #title>
              <div class="flex items-center gap-2">
                <LucideIcon name="MapPin" class="text-blue-500" :size="18" />
                <span>Location Details</span>
              </div>
            </template>

            <a-form-item label="Stop Title" name="title">
              <a-input
                v-model:value="formState.title"
                placeholder="e.g. Central Station Entrance"
                :disabled="disabled"
              />
            </a-form-item>

            <a-form-item label="Landmark" name="landmark">
              <a-input
                v-model:value="formState.landmark"
                placeholder="e.g. Near the main clock tower"
                :disabled="disabled"
              />
            </a-form-item>

            <a-form-item label="Stop Type" name="type">
              <a-select v-model:value="formState.type" :disabled="disabled">
                <a-select-option value="pickup">Pick-up Only</a-select-option>
                <a-select-option value="dropoff">Drop-off Only</a-select-option>
                <a-select-option value="both">Both (Pick & Drop)</a-select-option>
              </a-select>
            </a-form-item>
          </a-card>

          <!-- Coordinates & Status -->
          <a-card :bordered="false" class="shadow-sm rounded-2xl overflow-hidden">
            <template #title>
              <div class="flex items-center gap-2">
                <LucideIcon name="LocateFixed" class="text-orange-500" :size="18" />
                <span>Coordinates</span>
              </div>
            </template>

            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="Latitude" name="lat">
                  <a-input-number
                    v-model:value="formState.lat"
                    placeholder="e.g. 27.7172"
                    style="width: 100%"
                    :step="0.0001"
                    :disabled="disabled"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="Longitude" name="lng">
                  <a-input-number
                    v-model:value="formState.lng"
                    placeholder="e.g. 85.3240"
                    style="width: 100%"
                    :step="0.0001"
                    :disabled="disabled"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="Status" name="status" class="mb-0">
              <div
                class="flex items-center justify-between p-4 rounded-xl transition-colors duration-300 border"
                :class="
                  themeStore.isDark
                    ? 'bg-gray-800/50 border-gray-700'
                    : 'bg-gray-50 border-gray-100'
                "
              >
                <div class="flex flex-col">
                  <span
                    class="font-medium"
                    :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-700'"
                  >
                    {{ formState.status ? 'Active' : 'Inactive' }}
                  </span>
                  <span class="text-xs text-gray-400">
                    {{ formState.status ? 'Visible in routes' : 'Hidden from routes' }}
                  </span>
                </div>
                <a-switch v-model:checked="formState.status" :disabled="disabled" />
              </div>
            </a-form-item>
          </a-card>
        </div>
      </a-col>

      <!-- Right Column: Map Selection -->
      <a-col :xs="24" :lg="14">
        <a-card
          :bordered="false"
          class="h-full shadow-sm rounded-2xl overflow-hidden flex flex-col"
        >
          <template #title>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <LucideIcon name="Map" class="text-green-500" :size="18" />
                <span>Map Selection</span>
              </div>
              <a-button
                type="link"
                size="small"
                @click="getCurrentLocation"
                class="flex items-center gap-1"
              >
                <LucideIcon name="Locate" :size="14" />
                My Location
              </a-button>
            </div>
          </template>

          <div
            class="w-full rounded-xl overflow-hidden relative border border-gray-100 dark:border-gray-800"
            style="height: 500px"
          >
          {{authStore.generalSettings?.google_key}}
            <ol-map
              :loadTilesWhileAnimating="true"
              :loadTilesWhileInteracting="true"
              style="height: 100%; width: 100%"
              @click="onMapClick"
              class="cursor-crosshair"
            >
              <ol-view ref="viewRef" :center="center" :zoom="zoom" :projection="projection" />

              <ol-tile-layer :className="themeStore.isDark ? 'map-dark' : ''">
                 <ol-source-xyz
                 v-if="!authStore.generalSettings?.google_key &&  !authStore.isDemo"
                  :url="`https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${authStore.generalSettings?.google_key || ''}`"
                /> 
                <ol-source-xyz
                  v-else
                  :url="`https://tile.openstreetmap.org/{z}/{x}/{y}.png`"
                />
              </ol-tile-layer>

              <ol-zoom-control />
              <ol-attribution-control />

              <ol-vector-layer :updateWhileAnimating="true" :updateWhileInteracting="true">
                <ol-source-vector>
                  <ol-animation-drop :duration="5000" :repeat="8">
                    <ol-feature v-if="formState.lat && formState.lng">
                      <ol-geom-point :coordinates="[formState.lng, formState.lat]" />
                      <ol-style>
                        <ol-style-icon :src="stopIcon" :scale="0.5" />
                      </ol-style>
                    </ol-feature>
                  </ol-animation-drop>
                </ol-source-vector>
              </ol-vector-layer>
            </ol-map>

            <div
              class="absolute bottom-4 right-4  bg-blue-600/90 dark:bg-gray-900/90 px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 text-[10px] text-gray-100 z-10"
            >
              Click on the map to set marker position
            </div>
          </div>

          <div
            class="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20"
          >
            <div class="flex gap-3">
              <LucideIcon name="Info" class="text-blue-500 mt-1" :size="16" />
              <div class="text-xs text-blue-600 dark:text-blue-400">
                Tip: Zoom in for more precision. Map marker updates automatically when coordinate
                values change.
              </div>
            </div>
          </div>
        </a-card>
      </a-col>

      <!-- Action Buttons -->
      <a-col v-if="!hideActions" :span="24">
        <div class="flex items-center justify-end gap-3 mt-4">
          <a-button
            size="large"
            @click="$router.back()"
            class="px-8 rounded-xl flex items-center gap-2"
          >
            Cancel
          </a-button>
          <a-button
            type="primary"
            size="large"
            html-type="submit"
            :loading="loading"
            class="px-10 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {{ isEdit ? 'Update Stop' : 'Create Stop' }}
          </a-button>
        </div>
      </a-col>
    </a-row>
  </a-form>
</template>

<style scoped>
@reference "tailwindcss";

:deep(.ant-card-head) {
  border-bottom: 1px solid v-bind('themeStore.isDark ? "#374151" : "#f0f0f0"');
  padding: 0 24px;
}

:deep(.ant-card-body) {
  padding: 24px;
}

:deep(.ant-form-item-label > label) {
  @apply font-semibold;
  color: v-bind('themeStore.isDark ? "#9ca3af" : "#4b5563"');
}

:deep(.ant-input),
:deep(.ant-input-number),
:deep(.ant-select-selector) {
  border-radius: var(--radius-base) !important;
}

:deep(.ant-card) {
  border-radius: var(--radius-premium) !important;
}

.cursor-crosshair {
  cursor: crosshair;
}

:deep(.map-dark) {
  filter: invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%);
}
</style>
