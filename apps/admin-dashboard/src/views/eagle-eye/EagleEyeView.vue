<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import { mapService } from '@/services/map.service'
import { useThemeStore } from '@/stores/theme'
import LucideIcon from '@/components/LucideIcon.vue'
import OpenLayerMap from '@/components/OpenLayerMap.vue'

const themeStore = useThemeStore()

const loading = ref(false)
const searchText = ref('')
const activeStatus = ref('OFFLINE')
const center = ref({ lat: 0, lng: 0 }) 
const zoom = ref(2)
const locationModalVisible = ref(false)
const fetchingLocation = ref(false)
const manualCenter = ref({ lat: 0, lng: 0 })

const statusOptions = [
  { label: 'Online Drivers', value: 'ONLINE', icon: 'Power', color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'Track Drivers', value: 'TRACKING', icon: 'MapPin', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Offline Drivers', value: 'OFFLINE', icon: 'PowerOff', color: 'text-red-500', bg: 'bg-red-500/10' },
]

const getCenter = () => {
  if (navigator.geolocation) {
    fetchingLocation.value = true
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude
        const newLng = position.coords.longitude
        center.value = { lat: newLat, lng: newLng }
        manualCenter.value = { lat: newLat, lng: newLng }
        zoom.value = 16
        fetchingLocation.value = false
        
        // Save to localStorage to avoid asking every time
        localStorage.setItem('eagle_eye_center', JSON.stringify({ lat: newLat, lng: newLng }))
        
        message.success('Location fetched successfully')
      },
      (error) => {
        fetchingLocation.value = false
        console.warn('Geolocation error:', error.message)
        message.error('Failed to get location: ' + error.message)
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  } else {
    message.error('Geolocation is not supported by your browser')
  }
}

const allGroups = reactive({
  ONLINE: [],
  TRACKING: [],
  OFFLINE: []
})

const lastUpdate = ref(Date.now())

const counts = computed(() => {
  // Accessing lastUpdate ensures re-evaluation on every message
  lastUpdate.value
  return {
    ONLINE: allGroups.ONLINE.length,
    TRACKING: allGroups.TRACKING.length,
    OFFLINE: allGroups.OFFLINE.length,
  }
})

const markers = computed(() => {
  lastUpdate.value
  const drivers = allGroups[activeStatus.value] || []
  return drivers.map((item) => ({
    ...item,
    id: item.id || item._id,
    lng: item.location?.[0] || 0,
    lat: item.location?.[1] || 0,
    lastUpdate: lastUpdate.value
  }))
})

const selectedDriverId = ref(null)

const eventSource = ref(null)

const cleanupStream = () => {
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
  }
}

const setupStream = () => {
  console.log('Setting up real-time stream...')
  cleanupStream()
  loading.value = true

  // Safety timeout to stop spinner if connection hangs
  const timeoutId = setTimeout(() => {
    if (loading.value) {
      console.warn('Stream setup timeout reached')
      loading.value = false
    }
  }, 10000)

  try {
    // We request ALL data and filter locally for seamless tab switching
    const stream = mapService.getStream('ALL', searchText.value)
    eventSource.value = stream

    stream.onopen = () => {
      console.log('Stream connection opened successfully')
      clearTimeout(timeoutId)
      loading.value = false
    }

    stream.onmessage = (event) => {
      console.log('Stream data received')
      clearTimeout(timeoutId)
      loading.value = false
      try {
        const res = JSON.parse(event.data)
        if (res.groups) {
          Object.assign(allGroups, {
            ONLINE: res.groups.ONLINE || [],
            TRACKING: res.groups.TRACKING || [],
            OFFLINE: res.groups.OFFLINE || []
          })
          lastUpdate.value = Date.now()

          // 1. Auto-Follow Logic: If a driver is selected, update activeStatus if they move statuses
          if (selectedDriverId.value) {
            const currentGroupDrivers = allGroups[activeStatus.value] || []
            const isStillInCurrentGroup = currentGroupDrivers.some(d => (d.id || d._id) === selectedDriverId.value)
            
            if (!isStillInCurrentGroup) {
              // Find which group they moved to
              const statuses = ['ONLINE', 'TRACKING', 'OFFLINE']
              for (const s of statuses) {
                if (allGroups[s].some(d => (d.id || d._id) === selectedDriverId.value)) {
                  console.log(`Driver moved to ${s}, updating tab.`)
                  activeStatus.value = s
                  break
                }
              }
            }
          }
          
          // 2. Initial Setup: If current tab is empty but others have data, pick the first non-empty tab
          if (allGroups[activeStatus.value].length === 0) {
            const firstNotEmpty = ['ONLINE', 'TRACKING', 'OFFLINE'].find(s => allGroups[s].length > 0)
            if (firstNotEmpty) activeStatus.value = firstNotEmpty
          }
          
          // Auto-center on first available driver if map is at default and markers exist
          // Auto-center on first available driver if map is at default (0,0) and markers exist
          if (center.value.lat === 0 && markers.value.length > 0 && !selectedDriverId.value) {
            focusDriver(markers.value[0])
          }
        }
      } catch (e) {
        console.error('Error parsing stream data:', e)
      }
    }

    stream.onerror = (err) => {
      console.error('Stream connection error object:', err)
      clearTimeout(timeoutId)
      loading.value = false
      // Don't cleanup immediately on error, EventSource auto-retries
    }
  } catch (error) {
    console.error('Failed to setup stream execution:', error)
    clearTimeout(timeoutId)
    loading.value = false
  }
}

const focusDriver = (driver) => {
  if (!driver.lat || !driver.lng) return
  selectedDriverId.value = driver.id || driver._id
  center.value = { lat: driver.lat, lng: driver.lng }
  zoom.value = 16
}

let searchTimeout = null
const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    setupStream()
  }, 500)
}

onMounted(() => {
  // Try to load saved center from localStorage
  const savedCenter = localStorage.getItem('eagle_eye_center')
  if (savedCenter) {
    try {
      const parsed = JSON.parse(savedCenter)
      if (parsed.lat && parsed.lng) {
        center.value = parsed
        manualCenter.value = parsed
        zoom.value = 14 // Use a reasonable zoom for saved location
      }
    } catch (e) {
      console.error('Error parsing saved center:', e)
    }
  }

  // Only auto-fetch if we don't have a saved center
  if (center.value.lat === 0 && center.value.lng === 0) {
    getCenter()
    locationModalVisible.value = true
  }
  
  setupStream()
})

watch(locationModalVisible, (visible) => {
  if (visible && center.value.lat === 0 && center.value.lng === 0) {
    getCenter()
  }
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  cleanupStream()
})

// REMOVED activeStatus watch to prevent redundant stream re-connections
// Tab switching is now instant via local computed property filtering
</script>

<template>
  <div class="space-y-6 flex flex-col h-[calc(100vh-120px)]" :class="{ dark: themeStore.isDark }">
    <!-- Header Controls -->
    <div
      class="flex flex-col md:flex-row justify-between items-center p-6 rounded-3xl border shadow-sm transition-all duration-300 backdrop-blur-sm"
      :class="themeStore.isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-100'"
    >
      <div class="flex items-center gap-4 mb-4 md:mb-0">
        <div
          class="p-3 rounded-2xl transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-indigo-900/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'"
        >
          <LucideIcon name="MapPinned" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Eagle Eye
          </h1>
          <p
            class="text-sm transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Real-time driver monitoring and tracking
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <a-button
          v-for="opt in statusOptions"
          :key="opt.value"
          class="rounded-xl flex items-center gap-2 h-10 px-4 transition-all duration-300"
          :class="[
            activeStatus === opt.value 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 border-indigo-600' 
              : themeStore.isDark ? 'bg-gray-700 border-gray-600 text-gray-300 hover:text-indigo-400' : 'bg-white border-gray-200 text-gray-600 hover:text-indigo-600'
          ]"
          @click="activeStatus = opt.value"
        >
          <LucideIcon :name="opt.icon" :size="18" />
          <span class="font-medium font-outfit">{{ opt.label }}</span>
        </a-button>

        <a-button @click="locationModalVisible = true" class="rounded-xl flex items-center justify-center w-10 h-10 shadow-sm border-gray-200 dark:border-gray-600">
          <LucideIcon name="Navigation" :size="18" class="text-indigo-500" />
        </a-button>

        <a-button @click="setupStream()" class="rounded-xl flex items-center justify-center w-10 h-10 shadow-sm">
          <LucideIcon name="RotateCw" :size="18" :class="{ 'animate-spin': loading }" />
        </a-button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
      <!-- Side List -->
      <div class="w-full lg:w-80 flex flex-col gap-4 h-full min-h-[300px] lg:min-h-0">
        <a-card :bordered="false" class="shadow-sm rounded-3xl flex flex-col flex-1 overflow-hidden" :bodyStyle="{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }">
          <div class="p-4 border-b border-gray-100 dark:border-gray-700">
            <a-input
              v-model:value="searchText"
              placeholder="Search driver or phone..."
              class="rounded-xl h-10"
              @input="handleSearch"
            >
              <template #prefix>
                <LucideIcon name="Search" :size="16" class="text-gray-400" />
              </template>
            </a-input>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar">
            <a-list
              :data-source="markers"
              :loading="loading"
              class="driver-list"
            >
              <template #renderItem="{ item }">
                <a-list-item
                  class="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors px-4 py-3 border-l-4 border-transparent"
                  :class="{ 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/5': selectedDriverId === (item.id || item._id) }"
                  @click="focusDriver(item)"
                >
                  <div class="flex items-center gap-3 w-full">
                    <div class="relative">
                        <a-avatar :size="48" :src="item.picture" class="border-2 border-white shadow-sm" />
                        <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-sm" :class="activeStatus === 'ONLINE' ? 'bg-green-500' : activeStatus === 'TRACKING' ? 'bg-blue-500' : 'bg-gray-400'"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-bold text-gray-800 dark:text-gray-100 truncate capitalized">{{ item.fullname }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <LucideIcon name="Phone" :size="10" />
                        {{ item.phone }}
                      </div>
                    </div>
                    <LucideIcon name="ChevronRight" :size="16" class="text-gray-300" />
                  </div>
                </a-list-item>
              </template>
              <template #empty>
                <div class="flex flex-col items-center justify-center p-8 text-gray-400 mt-20">
                    <LucideIcon name="Map" :size="48" class="opacity-20 mb-4" />
                    <span>No drivers found</span>
                </div>
              </template>
            </a-list>
          </div>
          
          <div class="p-3 bg-gray-50 dark:bg-gray-800/50 text-center text-[10px] text-gray-400 uppercase tracking-tighter flex justify-between px-4">
            <span>Total: {{ markers.length }} drivers</span>
            <span>Last Update: {{ new Date(lastUpdate).toLocaleTimeString() }}</span>
          </div>
        </a-card>
      </div>

      <!-- Map Area -->
      <div class="flex-1 rounded-3xl overflow-hidden shadow-sm relative">
        <OpenLayerMap 
          :center="center" 
          :zoom="zoom" 
          :markers="markers" 
          height="100%" 
          :isDark="themeStore.isDark"
          @marker-click="focusDriver" 
        />
        
        <!-- Stats Overlay -->
        <div class="absolute top-4 right-4 z-10 flex gap-2">
            <div 
                v-for="opt in statusOptions" 
                :key="opt.value"
                class="px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 shadow-sm flex items-center gap-1.5"
                :class="[opt.bg, opt.color]"
            >
                <LucideIcon :name="opt.icon" :size="14" />
                <span class="text-sm font-bold">{{ counts[opt.value] }}</span>
            </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Location Modal -->
  <a-modal
    v-model:open="locationModalVisible"
    title="Map Center Settings"
    :footer="null"
    class="premium-location-modal"
    :width="450"
    centered
  >
    <div class="space-y-6 py-4">
      <div class="flex flex-col items-center text-center space-y-2">
        <div class="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center shadow-inner">
          <LucideIcon name="MapPin" :size="32" />
        </div>
        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100">Set Map Center</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Fetch your coordinates to center the eagle eye map precisely where you are.</p>
      </div>

      <div class="p-6 rounded-2xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Latitude</span>
            <div class="font-mono text-lg font-bold text-gray-700 dark:text-gray-200">
              {{ center.lat ? center.lat.toFixed(6) : '0.000000' }}
            </div>
          </div>
          <div class="space-y-1">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Longitude</span>
            <div class="font-mono text-lg font-bold text-gray-700 dark:text-gray-200">
              {{ center.lng ? center.lng.toFixed(6) : '0.000000' }}
            </div>
          </div>
        </div>

        <!-- Mini Map Preview -->
        <div v-if="center.lat !== 0" class="h-40 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-inner">
          <OpenLayerMap 
            :center="center" 
            :zoom="15" 
            height="100%" 
            :isDark="themeStore.isDark"
            :markers="[]"
          />
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <a-button 
          type="primary" 
          block 
          size="large" 
          @click="getCenter" 
          :loading="fetchingLocation"
          class="h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 border-none transition-all duration-300"
        >
          <LucideIcon name="Locate" :size="20" v-if="!fetchingLocation" />
          {{ fetchingLocation ? 'Detecting Location...' : 'Detect Current Location' }}
        </a-button>
        
        <a-button 
          block 
          size="large" 
          @click="locationModalVisible = false"
          class="h-12 rounded-2xl font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-500 border-none bg-transparent"
        >
          Done
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
@reference "tailwindcss";

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-gray-200 dark:bg-gray-700 rounded-full;
}

:deep(.ant-list-item) {
    @apply border-b-0!;
}

.driver-list {
    @apply border-0;
}
</style>