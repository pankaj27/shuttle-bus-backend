<template>
  <div class="mt-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h3 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
          <LucideIcon name="Activity" :style="{ color: isDark ? '#ffffff' : '#000' }" :size="24" />
          Route Performance HUD
        </h3> 
        <p class="text-sm text-gray-400 font-medium mt-1">
          Heat-mapped analysis of route efficiency and utilization
        </p>
      </div>
      
      <div 
        class="flex items-center gap-3 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
        :style="{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }"
      >
        <div class="flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span class="text-[10px] font-black text-red-600 uppercase tracking-widest">High Demand</span>
        </div>
        <div class="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div class="w-2 h-2 rounded-full bg-green-500"></div>
          <span class="text-[10px] font-black text-green-600 uppercase tracking-widest">Optimal</span>
        </div>
        <div class="flex items-center gap-2 px-3 py-1 rounded-lg" :style="{ backgroundColor: growthBadgeBg }">
          <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: colorPrimary }"></div>
          <span class="text-[10px] font-black uppercase tracking-widest" :style="{ color: colorPrimary }">Growth</span>
        </div>
      </div>
    </div>

    <!-- Performance Grid -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="h-64 rounded-4xl bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
    </div>

    <div v-else-if="performanceData && performanceData.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="route in performanceData" 
        :key="route.id"
        class="performance-card group"
      >
        <!-- Heat Glow Effect -->
        <div 
          class="absolute -inset-0.5 rounded-4xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-xl"
          :style="{ backgroundColor: getStatusColor(route.utilization) }"
        ></div>

        <div 
          class="relative rounded-4xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm h-full flex flex-col"
          :style="{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }"
        >
          <!-- Route Header -->
          <div class="flex justify-between items-start mb-6">
            <div class="flex flex-col">
              <span           :style="{ color: isDark ? '#ffffff' : '#000' }" class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{{ route.id }}</span>
              <h4            :style="{ color: isDark ? '#ffffff' : '#000' }" class="text-lg font-bold text-gray-800 dark:text-gray-100 line-clamp-1 capitalize">{{ route.name }}</h4>
            </div>
            <div 
              class="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              :style="{ backgroundColor: getStatusColor(route.utilization) }"
            >
              <LucideIcon :name="getHeatIcon(route.utilization)" :size="20" class="text-white" />
            </div>
          </div>

          <!-- Utilization Meter -->
          <div class="flex-1 mb-6">
            <div class="flex justify-between items-end mb-3">
              <span class="text-xs font-bold text-gray-500">Seat Utilization</span>
              <span  :style="{ color: isDark ? '#ffffff' : '#000' }" class="text-2xl font-black text-gray-800 dark:text-gray-100">{{ route.utilization }}%</span>
            </div>
            <div class="h-3 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden p-0.5 border border-gray-50 dark:border-gray-800">
              <div 
            
                class="h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(var(--c),0.4)]"
                :style="{ width: route.utilization + '%', backgroundColor: getStatusColor(route.utilization), '--c': getStatusColor(route.utilization) }"
              ></div>
            </div>
          </div>

          <!-- Bottom Stats -->
          <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div class="flex flex-col">
              <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Avg Profit</span>
              <span class="text-sm font-black text-green-500">{{ route.profitPerSeat }}</span>
            </div>
            <div class="flex flex-col border-l border-gray-100 dark:border-gray-700 pl-4">
              <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Daily Trips</span>
              <span  :style="{ color: isDark ? '#ffffff' : '#000' }" class="text-sm font-black text-gray-700 dark:text-gray-200">{{ route.dailyTrips }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-4xl border border-dashed border-gray-200 dark:border-gray-700">
      <LucideIcon name="Inbox" :size="48" class="text-gray-300 mb-4" />
      <p class="text-gray-500 font-medium">No route performance data available</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import LucideIcon from '@/components/LucideIcon.vue';
import { dashboardService } from '@/services/dashboard.service';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();
const { isDark, colorPrimary } = storeToRefs(themeStore);

const performanceData = ref([]);
const loading = ref(true);

const fetchPerformanceData = async () => {
  try {
    loading.value = true;
    const response = await dashboardService.getRoutePerformance();
    // Assuming response.data contains the array of performance metrics
    performanceData.value = response.data || [];
  } catch (error) {
    console.error('Failed to fetch route performance:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchPerformanceData();
});

const hexToRgba = (hex, alpha) => {
  let r = 0, g = 0, b = 0;
  // Remove # if present
  hex = hex.replace('#', '');
  
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const growthBadgeBg = computed(() => {
  return hexToRgba(colorPrimary.value, isDark.value ? 0.3 : 0.15); // Increased visibility for dark mode
});

const getStatusColor = (val) => {
  if (val > 85) return '#ef4444'; // red-500
  if (val > 60) return '#22c55e'; // green-500
  return colorPrimary.value;
};

const getHeatIcon = (val) => {
  if (val > 85) return 'Flame';
  if (val > 60) return 'TrendingUp';
  return 'Zap';
};
</script>

<style scoped>
@reference "tailwindcss";

.performance-card {
  @apply relative transition-all duration-300;
}

.performance-card:hover {
  transform: translateY(-5px);
}
</style>
