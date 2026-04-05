<template>
  <div class="mt-8">
    <!-- Toolbar -->
    <div class="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
      <div>
        <h3 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
          <LucideIcon name="Navigation" class="text-primary animate-pulse" :size="24" />
          Fleet Monitor Pro
        </h3>
        <p class="text-sm text-gray-400 font-medium mt-1">
          Real-time operational overview of active trips
        </p>
      </div>

      <div class="flex items-center gap-3 bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <!-- Filter Tabs -->
        <div class="flex p-1 bg-gray-50 dark:bg-gray-900 rounded-xl mr-2">
          <button 
            v-for="f in ['All', 'Ongoing', 'Delayed']" 
            :key="f"
            @click="activeFilter = f"
            class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300"
            :class="activeFilter === f ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'"
          >
            {{ f }}
          </button>
        </div>

        <div class="w-px h-6 bg-gray-100 dark:bg-gray-700 mx-1"></div>

        <!-- View Toggle -->
        <div class="flex gap-1">
          <button 
            @click="isGridView = true"
            class="p-2 rounded-xl transition-colors"
            :class="isGridView ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
          >
            <LucideIcon name="LayoutGrid" :size="18" />
          </button>
          <button 
            @click="isGridView = false"
            class="p-2 rounded-xl transition-colors"
            :class="!isGridView ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
          >
            <LucideIcon name="List" :size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div v-for="i in 4" :key="i" class="h-48 rounded-3xl bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
    </div>

    <!-- Grid Layout -->
    <div v-else-if="isGridView" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div 
        v-for="trip in filteredTrips" 
        :key="trip.id"
        class="card-premium group relative overflow-hidden"
      >
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <div class="flex items-center gap-3">
              <div 
                class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                :class="isOngoing(trip.status) ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20'"
              >
                {{ isOngoing(trip.status) ? 'Ongoing' : 'Delayed' }}
              </div>
              <span class="text-xs font-black text-gray-400 tracking-tighter uppercase">{{ trip.id }}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span class="text-[10px] font-bold text-gray-400">LIVE</span>
            </div>
          </div>

          <h4 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 group-hover:text-primary transition-colors line-clamp-1">
            {{ trip.route }}
          </h4>

          <!-- Occupancy HUD -->
          <div class="flex items-end justify-between mb-2">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Occupancy</span>
            <span class="text-xs font-black" :class="getLoadColor(trip.load)">{{ trip.load }} Full</span>
          </div>
          <div class="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-1000"
              :class="getLoadBg(trip.load)"
              :style="{ width: trip.load }"
            ></div>
          </div>
        </div>

        <!-- Expansion Details -->
        <div 
          v-if="expandedIds.includes(trip.id)" 
          class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 duration-300"
        >
          <div class="grid grid-cols-3 gap-4">
            <div class="flex flex-col">
              <span class="text-[9px] font-bold text-gray-400 uppercase">Bus Number</span>
              <span class="text-xs font-bold text-gray-700 dark:text-gray-200">#{{ trip.busId || 'B-9921' }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[9px] font-bold text-gray-400 uppercase">Velocity</span>
              <span class="text-xs font-bold text-gray-700 dark:text-gray-200">42 km/h</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[9px] font-bold text-gray-400 uppercase">Next Stop</span>
              <span class="text-xs font-bold text-gray-700 dark:text-gray-200">Central Hub</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50/30 dark:bg-gray-800/20 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50">
          <div class="flex items-center gap-3">
             <a-avatar src="https://xsgames.co/randomusers/avatar.php?g=pixel" :size="32" class="border-2 border-white dark:border-gray-700" />
             <div class="flex flex-col">
               <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Driver</span>
               <span class="text-xs font-bold text-gray-700 dark:text-gray-300 line-clamp-1 truncate max-w-[120px]">{{ trip.driver }}</span>
             </div>
          </div>

          <a-button 
            type="text" 
            size="small" 
            class="rounded-lg font-bold flex items-center gap-2 hover:bg-primary/5"
            :class="expandedIds.includes(trip.id) ? 'text-primary' : 'text-gray-500'"
            @click="toggleExpand(trip.id)"
          >
            {{ expandedIds.includes(trip.id) ? 'Hide Details' : 'Details' }}
            <LucideIcon :name="expandedIds.includes(trip.id) ? 'ChevronUp' : 'ChevronDown'" :size="14" />
          </a-button>
        </div>
      </div>
    </div>

    <!-- List Layout -->
    <div v-else class="space-y-3">
      <div 
        v-for="trip in filteredTrips" 
        :key="trip.id"
        class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 flex items-center justify-between group hover:shadow-md transition-all duration-300"
      >
        <div class="flex items-center gap-4 flex-1">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <LucideIcon name="BusFront" :size="20" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-0.5">
              <span class="text-xs font-black text-gray-400">{{ trip.id }}</span>
              <div 
                class="w-2 h-2 rounded-full" 
                :class="isOngoing(trip.status) ? 'bg-green-500' : 'bg-orange-500'"
              ></div>
            </div>
            <h5 class="text-sm font-bold text-gray-800 dark:text-gray-100 group-hover:text-primary transition-colors truncate">
              {{ trip.route }}
            </h5>
          </div>
        </div>

        <div class="flex items-center gap-8 pr-4">
          <div class="hidden md:block">
            <div class="text-[10px] font-bold text-gray-400 uppercase mb-1">Load</div>
            <span class="text-sm font-black text-gray-700 dark:text-gray-200">{{ trip.load }}</span>
          </div>
          <div class="hidden lg:block w-32">
            <div class="text-[10px] font-bold text-gray-400 uppercase mb-1">Driver</div>
            <span class="text-sm font-bold text-gray-700 dark:text-gray-200">{{ trip.driver }}</span>
          </div>
          <a-button type="text" shape="circle" class="hover:bg-primary/5">
            <LucideIcon name="ArrowRight" :size="18" class="text-gray-300 group-hover:text-primary" />
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';

const props = defineProps({
  trips: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});

const activeFilter = ref('All');
const isGridView = ref(true);
const expandedIds = ref([]);

const filteredTrips = computed(() => {
  if (activeFilter.value === 'All') return props.trips;
  return props.trips.filter(t => {
    const ongoing = isOngoing(t.status);
    return activeFilter.value === 'Ongoing' ? ongoing : !ongoing;
  });
});

const isOngoing = (status) => {
  return status === 'Ongoing' || status === true || status === 'Active';
};

const toggleExpand = (id) => {
  const idx = expandedIds.value.indexOf(id);
  if (idx > -1) expandedIds.value.splice(idx, 1);
  else expandedIds.value.push(id);
};

const getLoadColor = (load) => {
  const val = parseInt(load);
  if (val > 85) return 'text-red-500';
  if (val > 60) return 'text-orange-500';
  return 'text-green-500';
};

const getLoadBg = (load) => {
  const val = parseInt(load);
  if (val > 85) return 'bg-red-500';
  if (val > 60) return 'bg-orange-500';
  return 'bg-primary';
};
</script>

<style scoped>
@reference "tailwindcss";

.card-premium {
  @apply bg-white dark:bg-gray-800 rounded-3xl transition-all duration-300 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-xl;
}
</style>
