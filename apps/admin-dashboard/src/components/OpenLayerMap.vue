<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import busOnlineMarker  from "@/assets/images/maps/bus-online.svg"
import busOfflineMarker  from "@/assets/images/maps/bus-offline.svg"
import busTrackingMarker  from "@/assets/images/maps/bus-tracking.svg"

const authStore = useAuthStore()
const props = defineProps({
  center: {
    type: Object,
    default: () => ({ lat: 0, lng: 0 }), // Neutral default
  },
  zoom: {
    type: Number,
    default: 12,
  },
  markers: {
    type: Array,
    default: () => [],
  },
  height: {
    type: String,
    default: '500px',
  },
  isDark: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['marker-click', 'map-click'])

const projection = ref('EPSG:4326')
const viewRef = ref(null)
const selectedMarker = ref(null)

const onMapClick = (event) => {
  emit('map-click', event)
  selectedMarker.value = null
}

const handleMarkerClick = (event) => {
  const selected = event.selected || []
  if (selected.length > 0) {
    const feature = selected[0]
    const properties = feature.getProperties()
    selectedMarker.value = properties.markerData
    emit('marker-click', selectedMarker.value)
  } else {
    selectedMarker.value = null
  }
}

// Watch for center changes to pan
watch(
  () => props.center,
  (newCenter) => {
    if (newCenter && newCenter.lat && newCenter.lng && viewRef.value?.view) {
      viewRef.value.view.animate({
        center: [newCenter.lng, newCenter.lat],
        duration: 800,
      })
    }
  },
  { deep: true },
)

onMounted(() => {
  if (props.center?.lat && props.center?.lng && viewRef.value?.view) {
    viewRef.value.view.setCenter([props.center.lng, props.center.lat])
  }
})
</script>

<template>
  <div class="open-layers-map w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 relative" :style="{ height }">
    <ol-map
      :loadTilesWhileAnimating="true"
      :loadTilesWhileInteracting="true"
      style="height: 100%; width: 100%"
      @click="onMapClick"
    >
      <ol-view ref="viewRef" :center="[center.lng, center.lat]" :zoom="zoom" :projection="projection" />

      <ol-tile-layer :className="props.isDark ? 'map-dark' : ''">
          <ol-source-xyz
                 v-if="!authStore.generalSettings?.google_key && !authStore.isDemo"
                  :url="`https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${authStore.generalSettings?.google_key || ''}`"
                /> 
                <ol-source-xyz
                  v-else
                  :url="`https://tile.openstreetmap.org/{z}/{x}/{y}.png`"
                />
      </ol-tile-layer>

      <ol-zoom-control />
      <ol-attribution-control />

      <!-- Markers Layer -->
      <ol-vector-layer>
        <ol-source-vector>
          <ol-feature 
            v-for="(marker, index) in markers" 
            :key="`${marker.id || index}-${marker.lat}-${marker.lng}-${marker.duty_status}`" 
            :properties="{ markerData: marker }"
          >
            <ol-geom-point :coordinates="[marker.lng, marker.lat]" />
            <ol-style>
              <ol-style-icon 
                :src="marker.duty_status === 'ONLINE' ? busOnlineMarker : marker.duty_status === 'OFFLINE' ? busOfflineMarker : busTrackingMarker" 
                :scale="0.09" 
                :anchor="[0.5, 0.5]"
              />
              <ol-style-text :text="marker.fullname" :offsetY="40">
                <ol-style-fill color="#374151" />
                <ol-style-stroke color="#ffffff" :width="3" />
              </ol-style-text>
            </ol-style>
          </ol-feature>
        </ol-source-vector>
        
        <ol-interaction-select @select="handleMarkerClick">
            <ol-style>
                <!-- Removed empty icon style that caused crash -->
                <ol-style-stroke color="#6366f1" :width="4" />
                <ol-style-circle :radius="25">
                    <ol-style-stroke color="#6366f1" :width="2" />
                </ol-style-circle>
            </ol-style>
        </ol-interaction-select>
      </ol-vector-layer>

      <!-- Popup Overlay -->
      <ol-overlay v-if="selectedMarker" :position="[selectedMarker.lng, selectedMarker.lat]">
        <template #default>
            <div class="map-popup backdrop-blur-md bg-white/90 dark:bg-gray-800/90 p-3 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 min-w-[150px] -translate-y-16">
                <slot name="popup" :marker="selectedMarker">
                    <div class="flex items-center gap-3">
                        <img :src="selectedMarker.picture" class="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm" />
                        <div>
                            <div class="font-bold text-gray-800 dark:text-gray-100 text-xs">{{ selectedMarker.fullname }}</div>
                            <div class="text-[10px] text-gray-500">{{ selectedMarker.phone }}</div>
                        </div>
                    </div>
                </slot>
                <!-- Arrow -->
                <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/90 dark:bg-gray-800/90 border-r border-b border-gray-100 dark:border-gray-700 rotate-45"></div>
            </div>
        </template>
      </ol-overlay>
    </ol-map>
  </div>
</template>

<style scoped>
.open-layers-map {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

:deep(.map-dark) {
  filter: invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%);
}
</style>
