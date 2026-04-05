<template>
  <div class="mt-8">
    <!-- Section Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
          <LucideIcon name="Navigation" class="text-primary animate-pulse" :size="24" />
          Active Fleet Status
        </h3>
        <p class="text-sm text-gray-400 font-medium mt-1">
          <template v-if="loading">Refreshing fleet data...</template>
          <template v-else>Monitoring {{ trips.length }} vehicles in live operation</template>
        </p>
      </div>
      <div class="flex gap-3" v-if="!loading">
        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div class="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
          <span class="text-xs font-bold text-gray-600 dark:text-gray-300">Live Sync</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <a-card v-for="i in 4" :key="i" :bordered="false" class="card-premium animate-pulse p-6">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700"></div>
          <div class="space-y-2">
            <div class="w-24 h-3 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <div class="w-48 h-4 bg-gray-100 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        <div class="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full mb-6"></div>
        <div class="flex justify-between items-center">
          <div class="w-32 h-8 bg-gray-100 dark:bg-gray-700 rounded-xl"></div>
          <div class="w-20 h-4 bg-gray-100 dark:bg-gray-700 rounded"></div>
        </div>
      </a-card>
    </div>

    <!-- Empty State -->
    <div v-else-if="trips.length === 0" class="card-premium p-12 text-center">
      <LucideIcon name="Inbox" :size="48" class="mx-auto text-gray-300 mb-4" />
      <h4 class="text-lg font-bold text-gray-800 dark:text-gray-100">No active trips</h4>
      <p class="text-gray-400">There are currently no vehicles on the road.</p>
    </div>

    <!-- Card Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div 
        v-for="trip in trips" 
        :key="trip.id"
        class="card-premium group hover:scale-[1.01] transition-all duration-300 overflow-hidden"
      >
        <!-- Card Header & Route -->
        <div class="p-6 pb-2">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
              <div 
                class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                :class="trip.status === 'Ongoing' || trip.status === true ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20'"
              >
                {{ (trip.status === 'Ongoing' || trip.status === true) ? 'Ongoing' : 'Delayed' }}
              </div>
              <span class="text-xs font-black text-gray-400 tracking-tighter uppercase">{{ trip.id }}</span>
            </div>
            <a-button type="text" shape="circle" class="hover:bg-primary/5 flex items-center justify-center">
              <LucideIcon name="Map" :size="18" class="text-gray-400 group-hover:text-primary transition-colors" />
            </a-button>
          </div>
          
          <h4 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 group-hover:text-primary transition-colors">
            {{ trip.route }}
          </h4>

          <!-- Progress Visualization (Lite version) -->
          <div class="relative h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full mb-6 overflow-hidden">
            <div 
              class="absolute top-0 left-0 h-full bg-linear-to-r from-primary to-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
              :style="{ width: (trip.status === 'Ongoing' || trip.status === true) ? '65%' : '30%' }"
            ></div>
          </div>
        </div>

        <!-- Footer Stats -->
        <div class="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50">
          <div class="flex items-center gap-6">
             <!-- Occupancy/Load -->
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Occupancy</span>
              <div class="flex items-center gap-2">
                <span class="text-sm font-black text-gray-800 dark:text-gray-200">{{ trip.load || '0%' }}</span>
                <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden hidden sm:block">
                  <div 
                    class="h-full bg-primary rounded-full"
                    :style="{ width: trip.load }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="h-8 w-[1px] bg-gray-200 dark:bg-gray-700"></div>

            <!-- Driver Info -->
            <div class="flex items-center gap-3">
              <a-avatar src="https://xsgames.co/randomusers/avatar.php?g=pixel" :size="32" class="border-2 border-white dark:border-gray-700 shadow-sm" />
              <div class="flex flex-col">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Driver</span>
                <span class="text-xs font-bold text-gray-700 dark:text-gray-300 line-clamp-1 truncate max-w-[100px]">{{ trip.driver }}</span>
              </div>
            </div>
          </div>

          <a-button type="primary" size="small" class="rounded-lg font-bold px-4 h-8 bg-blue-600 border-0 flex items-center gap-2">
            Details
            <LucideIcon name="ChevronRight" :size="14" />
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue';

defineProps({
  trips: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
@reference "tailwindcss";

.card-premium {
  @apply bg-white dark:bg-gray-800 rounded-3xl transition-all duration-300 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-xl;
}

.dark .card-premium {
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.4);
}
</style>


