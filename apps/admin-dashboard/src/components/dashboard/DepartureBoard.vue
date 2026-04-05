<template>
  <div class="mt-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h3 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
          <LucideIcon name="Monitor" class="text-primary" :size="24" />
          Terminal Departure Board
        </h3>
        <p class="text-sm text-gray-400 font-medium mt-1">
          Next 2 hours of scheduled fleet departures
        </p>
      </div>
      
      <div class="hidden md:flex items-center gap-6">
        <div class="flex flex-col items-end">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Local Time</span>
          <span class="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase">{{ currentTime }}</span>
        </div>
      </div>
    </div>

    <!-- Departure Board -->
    <div class="bg-gray-950 rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
      <!-- Table Header -->
      <div class="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-900/50 border-b border-gray-800 font-black text-[10px] text-gray-500 uppercase tracking-[0.2em]">
        <div class="col-span-2">Time</div>
        <div class="col-span-4">Destination</div>
        <div class="col-span-2">Trip ID</div>
        <div class="col-span-2">Plate/Bus</div>
        <div class="col-span-2 text-right">Status</div>
      </div>

      <!-- Departure Rows -->
      <div class="divide-y divide-gray-900">
        <div 
          v-for="trip in departures" 
          :key="trip.id"
          class="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-white/5 transition-colors group cursor-default"
        >
          <!-- Time -->
          <div class="col-span-2">
            <span class="text-lg font-mono font-bold text-yellow-500 tracking-wider group-hover:scale-110 transition-transform inline-block">
              {{ trip.time }}
            </span>
          </div>

          <!-- Destination -->
          <div class="col-span-4 flex flex-col">
            <span class="text-base font-bold text-gray-100 uppercase tracking-tight">{{ trip.destination }}</span>
            <span class="text-[10px] font-bold text-gray-500 uppercase">via {{ trip.via }}</span>
          </div>

          <!-- ID -->
          <div class="col-span-2">
            <span class="px-2 py-1 bg-gray-800 rounded text-[10px] font-black text-gray-400 border border-gray-700">
              {{ trip.id }}
            </span>
          </div>

          <!-- Bus -->
          <div class="col-span-2 flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
            <span class="text-sm font-bold text-gray-400 font-mono">{{ trip.bus }}</span>
          </div>

          <!-- Status -->
          <div class="col-span-2 text-right">
            <div 
              class="inline-block px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border"
              :class="getStatusStyles(trip.status)"
            >
              {{ trip.status }}
            </div>
          </div>
        </div>
      </div>

      <!-- Board Footer -->
      <div class="px-6 py-3 bg-gray-900/80 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span class="text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em]">System Operational • Real-time Sync Active</span>
        </div>
        <div class="text-[9px] font-bold text-gray-600 uppercase">Page 1 of 1</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';

const currentTime = ref('');
const departures = [
  { time: '14:30', destination: 'Central Airport', via: 'Downtown Express', id: 'JT-1021', bus: 'NR-9921', status: 'Boarding' },
  { time: '14:45', destination: 'University Hub', via: 'Campus North', id: 'JT-1025', bus: 'NR-8842', status: 'On Time' },
  { time: '15:00', destination: 'IT Tech Park', via: 'Westside Link', id: 'JT-1032', bus: 'NR-1120', status: 'On Time' },
  { time: '15:15', destination: 'East Residential', via: 'Main St North', id: 'JT-1038', bus: 'NR-4431', status: 'Delayed' },
  { time: '15:30', destination: 'New City Plaza', via: 'Beltway Direct', id: 'JT-1045', bus: 'NR-7750', status: 'Boarding' },
  { time: '16:00', destination: 'Coastal Marine', via: 'South Express', id: 'JT-1051', bus: 'NR-3310', status: 'On Time' }
];

const getStatusStyles = (status) => {
  switch (status) {
    case 'Boarding':
      return 'bg-green-500/10 text-green-500 border-green-500/50 animate-pulse';
    case 'Delayed':
      return 'bg-red-500/10 text-red-500 border-red-500/50';
    case 'On Time':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/50';
    default:
      return 'bg-gray-800 text-gray-400 border-gray-700';
  }
};

let timer = null;
onMounted(() => {
  const updateClock = () => {
    const now = new Date();
    currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  updateClock();
  timer = setInterval(updateClock, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
@reference "tailwindcss";

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .7; }
}

font-mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
</style>
