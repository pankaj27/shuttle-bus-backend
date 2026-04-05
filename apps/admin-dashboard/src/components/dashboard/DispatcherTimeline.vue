<template>
  <div class="mt-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
          <LucideIcon name="CalendarClock" class="text-primary" :size="24" />
          Dispatcher Timeline
        </h3>
        <p class="text-sm text-gray-400 font-medium mt-1">
          Monitoring {{ timelineData.length }} driver shifts and route overlaps
        </p>
      </div>
      <div class="flex items-center gap-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-primary/20 border border-primary"></div>
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-orange-100 border border-orange-400"></div>
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Break</span>
        </div>
      </div>
    </div>

    <!-- Timeline Container -->
    <div class="card-premium overflow-hidden">
      <div class="flex flex-col h-full min-w-[800px]">
        
        <!-- Time Scale Header -->
        <div class="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
          <div class="w-64 p-4 border-r border-gray-100 dark:border-gray-700 font-black text-[10px] text-gray-400 uppercase tracking-widest">
            Driver / Resource
          </div>
          <div class="flex-1 flex relative h-12">
            <div 
              v-for="hour in hours" 
              :key="hour"
              class="flex-1 border-r border-gray-100/50 dark:border-gray-700/50 flex items-center justify-center text-[10px] font-bold text-gray-400"
            >
              {{ hour }}
            </div>
            <!-- Current Time Marker -->
            <div 
              class="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 shadow-[0_0_8px_rgba(239,44,44,0.5)]"
              :style="{ left: currentTimePosition + '%' }"
            >
              <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full px-2 py-0.5 bg-red-500 text-white text-[8px] font-black rounded-t-lg">
                LIVE
              </div>
            </div>
          </div>
        </div>

        <!-- Driver Rows -->
        <div class="max-h-[500px] overflow-y-auto custom-scrollbar">
          <div 
            v-for="driver in timelineData" 
            :key="driver.id"
            class="flex border-b border-gray-100 dark:border-gray-700 group hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors"
          >
            <!-- Driver Info Col -->
            <div class="w-64 p-4 border-r border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <a-avatar :src="driver.avatar" :size="36" class="border-2 border-white dark:border-gray-800 shadow-sm" />
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-bold text-gray-800 dark:text-gray-100 truncate capitalized">{{ driver.name }}</span>
                <span class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{{ driver.id }}</span>
              </div>
            </div>

            <!-- Timeline Bars Col -->
            <div class="flex-1 relative flex items-center h-16">
              <!-- Background Grid -->
              <div class="absolute inset-0 flex">
                <div v-for="h in hours" :key="h" class="flex-1 border-r border-gray-100/30 dark:border-gray-700/30"></div>
              </div>

              <!-- Trip Bars -->
              <div 
                v-for="trip in driver.trips" 
                :key="trip.id"
                class="absolute h-10 shadow-lg rounded-xl flex items-center px-4 cursor-pointer hover:scale-[1.02] transition-all duration-300 group/trip"
                :class="getTripStyles(trip.status)"
                :style="{ 
                  left: getPosition(trip.start) + '%', 
                  width: getWidth(trip.start, trip.end) + '%' 
                }"
              >
                <div class="flex flex-col overflow-hidden">
                  <span class="text-[9px] font-black uppercase tracking-tighter line-clamp-1 mb-0.5">
                    {{ trip.id }} • {{ trip.route }}
                  </span>
                  <span class="text-[8px] font-black opacity-60 uppercase">
                    {{ trip.start }} - {{ trip.end }}
                  </span>
                </div>
                
                <!-- Tooltip / Hover Effect -->
                <div class="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/trip:opacity-100 transition-all duration-300 pointer-events-none z-20">
                  <div class="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl">
                    {{ trip.route }} ({{ trip.load }} Load)
                  </div>
                  <div class="w-2 h-2 bg-gray-800 rotate-45 mx-auto -mt-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';

const hours = [
  '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'
];

const timelineData = [
  {
    id: 'DRV-501',
    name: 'Adam Smith',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&id=1',
    trips: [
      { id: 'TRP-1001', route: 'Downtown -> Airport', start: '06:30', end: '08:45', status: 'completed', load: '85%' },
      { id: 'TRP-1005', route: 'Airport -> City Hub', start: '09:30', end: '11:15', status: 'ongoing', load: '60%' },
      { id: 'TRP-1012', route: 'City Hub -> North Plaza', start: '14:00', end: '16:30', status: 'scheduled', load: '0%' }
    ]
  },
  {
    id: 'DRV-502',
    name: 'Sarah Connor',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&id=2',
    trips: [
      { id: 'TRP-1002', route: 'Campus Shuttle North', start: '07:00', end: '10:30', status: 'completed', load: '100%' },
      { id: 'TRP-1008', route: 'Campus Shuttle South', start: '11:30', end: '14:00', status: 'ongoing', load: '95%' },
      { id: 'TRP-1015', route: 'Evening Express', start: '17:00', end: '20:30', status: 'scheduled', load: '0%' }
    ]
  },
  {
    id: 'DRV-503',
    name: 'Mike Ross',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&id=3',
    trips: [
      { id: 'TRP-1003', route: 'Westside Loop', start: '08:00', end: '12:00', status: 'completed', load: '40%' },
      { id: 'TRP-1009', route: 'Main St Express', start: '13:00', end: '17:00', status: 'ongoing', load: '55%' }
    ]
  },
  {
    id: 'DRV-504',
    name: 'Jessica Pearson',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&id=4',
    trips: [
      { id: 'TRP-1004', route: 'Tech Park Direct', start: '06:00', end: '09:00', status: 'completed', load: '65%' },
      { id: 'TRP-1010', route: 'Office Shuttle', start: '10:00', end: '13:00', status: 'break', load: '-' },
      { id: 'TRP-1018', route: 'Late Hub Run', start: '15:30', end: '19:00', status: 'scheduled', load: '0%' }
    ]
  }
];

const startTime = 6; // 6 AM
const endTime = 22; // 10 PM
const totalDuration = endTime - startTime;

const getPosition = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = (h - startTime) * 60 + m;
  return (totalMinutes / (totalDuration * 60)) * 100;
};

const getWidth = (startStr, endStr) => {
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  const duration = (eh * 60 + em) - (sh * 60 + sm);
  return (duration / (totalDuration * 60)) * 100;
};

const getTripStyles = (status) => {
  switch (status) {
    case 'ongoing':
      return 'bg-blue-600 text-white border-none ring-4 ring-blue-500/10 shadow-blue-500/20';
    case 'completed':
      return 'bg-green-500 text-white border-none shadow-green-500/10 opacity-70';
    case 'scheduled':
      return 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-700 shadow-none';
    case 'break':
      return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 border-dashed';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const currentTimePosition = ref(0);
let timer = null;

const updateLiveMarker = () => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  
  if (h < startTime) currentTimePosition.value = 0;
  else if (h >= endTime) currentTimePosition.value = 100;
  else {
    const totalMinutes = (h - startTime) * 60 + m;
    currentTimePosition.value = (totalMinutes / (totalDuration * 60)) * 100;
  }
};

onMounted(() => {
  updateLiveMarker();
  timer = setInterval(updateLiveMarker, 60000); // Update every minute
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
@reference "tailwindcss";

.card-premium {
  @apply bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-gray-200 dark:bg-gray-700 rounded-full;
}
</style>
