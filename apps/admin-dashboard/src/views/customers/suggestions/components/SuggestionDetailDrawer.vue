<template>
  <a-drawer
    :title="`Suggestion Details`"
    :open="visible"
    @close="$emit('close')"
    width="600"
    class="suggestion-detail-drawer"
    :footer-style="{ textAlign: 'right' }"
  >
    <div class="space-y-6" v-if="suggestion">
      <!-- User Info Card -->
      <div 
        class="flex items-center gap-4 p-4 rounded-3xl border transition-colors duration-300"
        :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-blue-50/50 border-blue-100'"
      >
        <div class="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
           <LucideIcon name="User" :size="24" />
        </div>
        <div class="flex flex-col">
          <h3 class="font-bold text-lg m-0 text-gray-900" :class="{ 'text-gray-100': themeStore.isDark }">
            {{ suggestion.fullname || 'Guest User' }}
          </h3>
          <span class="text-blue-600 font-medium flex items-center gap-1 text-sm">
             <LucideIcon name="Phone" :size="14" /> {{ suggestion.phone || 'N/A' }}
          </span>
        </div>
      </div>

      <!-- Location Details -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          class="p-4 rounded-2xl border shadow-sm transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
        >
           <div class="flex items-center gap-2 mb-2">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              <span class="text-[10px] uppercase font-bold text-gray-400">Pickup Point</span>
           </div>
           <p class="text-sm font-medium m-0" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-800'">
             {{ suggestion.pickup_address }}
           </p>
        </div>
        <div 
          class="p-4 rounded-2xl border shadow-sm transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
        >
           <div class="flex items-center gap-2 mb-2">
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              <span class="text-[10px] uppercase font-bold text-gray-400">Drop-off Point</span>
           </div>
           <p class="text-sm font-medium m-0" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-800'">
             {{ suggestion.drop_address }}
           </p>
        </div>
      </div>

      <!-- Map -->
      <div class="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 h-[400px]">
        <ol-map
          v-if="visible && hasCoordinates"
          :loadTilesWhileAnimating="true"
          :loadTilesWhileInteracting="true"
          style="height: 100%; width: 100%"
        >
          <ol-view ref="viewRef" :center="mapCenter" :zoom="mapZoom" :projection="projection" />

          <ol-tile-layer>
          <ol-source-xyz 
          :url="`https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${authStore.generalSettings?.google_key || ''}`" 
        />
          </ol-tile-layer>

          <ol-vector-layer>
            <ol-source-vector>
              <!-- Pickup Marker -->
              <ol-feature v-if="suggestion.pickup_coordinates">
                <ol-geom-point :coordinates="suggestion.pickup_coordinates" />
                <ol-style>
                  <ol-style-icon :src="stopIcon" :scale="0.4" color="green" />
                </ol-style>
              </ol-feature>

              <!-- Drop Marker -->
              <ol-feature v-if="suggestion.drop_coordinates">
                <ol-geom-point :coordinates="suggestion.drop_coordinates" />
                <ol-style>
                  <ol-style-icon :src="stopIcon" :scale="0.4" color="red" />
                </ol-style>
              </ol-feature>

            </ol-source-vector>
          </ol-vector-layer>
        </ol-map>
        
        <div v-else-if="!hasCoordinates" class="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 text-gray-400 gap-3">
           <LucideIcon name="Map" :size="48" class="opacity-20" />
           <span class="text-sm">No GPS coordinates available for this suggestion</span>
        </div>
      </div>

      <div class="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest px-2">
         <span>ID: {{ suggestion.ids || suggestion.id }}</span>
         <span>Suggested on {{ suggestion.createdAt }}</span>
      </div>
    </div>

    <template #footer>
      <a-button @click="$emit('close')" class="rounded-xl">Close View</a-button>
    </template>
  </a-drawer>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import stopIcon from '@/assets/images/stops/stop.svg'

const props = defineProps({
  visible: Boolean,
  suggestion: Object,
})

const emit = defineEmits(['close'])
const themeStore = useThemeStore()
const authStore = useAuthStore()

const mapZoom = ref(11)
const projection = ref('EPSG:4326')
const viewRef = ref(null)

const hasCoordinates = computed(() => {
  return props.suggestion?.pickup_coordinates?.length === 2 || 
         props.suggestion?.drop_coordinates?.length === 2
})

const mapCenter = ref([0, 0])

// Focus view when drawer opens or suggestion changes
watch([() => props.visible, () => props.suggestion], async ([isVisible, sug]) => {
  if (isVisible && sug && hasCoordinates.value) {
    // Small delay to ensure map is mounted and view is ready
    setTimeout(() => {
      if (!viewRef.value?.view) return

      const coords = []
      if (sug.pickup_coordinates) coords.push(sug.pickup_coordinates)
      if (sug.drop_coordinates) coords.push(sug.drop_coordinates)

      if (coords.length > 0) {
        if (coords.length === 1) {
          mapCenter.value = coords[0]
          mapZoom.value = 14
        } else {
          // Calculate bounding box for both points
          const minX = Math.min(coords[0][0], coords[1][0])
          const minY = Math.min(coords[0][1], coords[1][1])
          const maxX = Math.max(coords[0][0], coords[1][0])
          const maxY = Math.max(coords[0][1], coords[1][1])
          
          viewRef.value.view.fit([minX, minY, maxX, maxY], {
            padding: [50, 50, 50, 50],
            duration: 1000,
            maxZoom: 15
          })
        }
      }
    }, 300)
  }
})

// We need to import extend logic if we want to use 'fit' 
// But since we are using vue3-openlayers, maybe it's better to just set center/zoom manually if possible
// For simplicity, let's keep it basic first.
</script>

<style scoped>
@reference "tailwindcss";

:deep(.ant-drawer-content) {
  @apply rounded-l-3xl overflow-hidden;
}

:deep(.ant-drawer-header) {
  @apply border-b border-gray-100 dark:border-gray-700 py-6;
}

:deep(.ant-drawer-title) {
  @apply text-xl font-bold text-gray-900 dark:text-gray-100;
}
</style>
