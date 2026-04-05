<template>
  <div class="mt-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h3 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
          <LucideIcon name="Trophy" class="text-yellow-500" :size="24" />
          Driver Performance Leaderboard
        </h3>
        <p class="text-sm text-gray-400 font-medium mt-1">
          Top-performing drivers based on rating and punctuality
        </p>
      </div>
      
      <div class="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Cycle: Weekly</span>
      </div>
    </div>

    <!-- Leaderboard Table -->
    <div class="card-premium overflow-hidden">
      <div class="grid grid-cols-12 gap-4 px-8 py-4 bg-gray-50/50 dark:bg-gray-900/20 border-b border-gray-100 dark:border-gray-700 font-black text-[10px] text-gray-400 uppercase tracking-widest">
        <div class="col-span-1">Rank</div>
        <div class="col-span-4">Driver</div>
        <div class="col-span-2 text-center">Rating</div>
        <div class="col-span-2 text-center">Punctuality</div>
        <div class="col-span-3 text-right">Activity Status</div>
      </div>

      <div class="divide-y divide-gray-100 dark:divide-gray-700/50">
        <div 
          v-for="(driver, index) in leaderboardData" 
          :key="driver.id"
          class="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-300 group"
        >
          <!-- Rank -->
          <div class="col-span-1">
            <div 
              class="w-8 h-8 rounded-xl flex items-center justify-center font-black"
              :class="getRankStyles(index)"
            >
              {{ index + 1 }}
            </div>
          </div>

          <!-- Driver -->
          <div class="col-span-4 flex items-center gap-4">
            <div class="relative">
              <a-avatar :src="driver.avatar" :size="48" class="border-2 border-white dark:border-gray-700 shadow-md" />
              <div v-if="index === 0" class="absolute -top-1 -right-1 bg-yellow-500 p-1 rounded-full shadow-lg">
                <LucideIcon name="Crown" :size="10" class="text-white" />
              </div>
            </div>
            <div class="flex flex-col">
              <span class="text-base font-bold text-gray-800 dark:text-gray-100">{{ driver.name }}</span>
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{{ driver.id }}</span>
            </div>
          </div>

          <!-- Rating -->
          <div class="col-span-2 flex flex-col items-center">
            <div class="flex items-center gap-1.5 text-yellow-500 mb-1">
              <LucideIcon name="Star" :size="14" fill="currentColor" />
              <span class="text-base font-black">{{ driver.rating }}</span>
            </div>
            <span class="text-[9px] font-bold text-gray-400 uppercase">Avg Rating</span>
          </div>

          <!-- Punctuality -->
          <div class="col-span-2 flex flex-col items-center">
            <span class="text-base font-black text-primary">{{ driver.punctuality }}%</span>
            <div class="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1.5 overflow-hidden">
              <div 
                class="h-full bg-primary rounded-full"
                :style="{ width: driver.punctuality + '%' }"
              ></div>
            </div>
          </div>

          <!-- Status -->
          <div class="col-span-3 text-right">
            <div class="flex flex-col items-end">
               <div class="flex items-center gap-2 mb-1">
                 <div class="w-2 h-2 rounded-full" :class="driver.onDuty ? 'bg-green-500' : 'bg-gray-300'"></div>
                 <span class="text-[10px] font-black uppercase tracking-widest" :class="driver.onDuty ? 'text-green-600' : 'text-gray-400'">
                   {{ driver.onDuty ? 'On Duty' : 'Off Duty' }}
                 </span>
               </div>
               <span class="text-[9px] font-bold text-gray-400">{{ driver.totalTrips }} Trips Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';

const leaderboardData = [
  {
    id: 'DRV-501',
    name: 'Adam Smith',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&id=1',
    rating: 4.95,
    punctuality: 98,
    onDuty: true,
    totalTrips: 1242
  },
  {
    id: 'DRV-504',
    name: 'Jessica Pearson',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&id=4',
    rating: 4.92,
    punctuality: 99,
    onDuty: false,
    totalTrips: 856
  },
  {
    id: 'DRV-502',
    name: 'Sarah Connor',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&id=2',
    rating: 4.88,
    punctuality: 94,
    onDuty: true,
    totalTrips: 2105
  },
  {
    id: 'DRV-503',
    name: 'Mike Ross',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&id=3',
    rating: 4.85,
    punctuality: 96,
    onDuty: true,
    totalTrips: 143
  },
  {
    id: 'DRV-505',
    name: 'Harvey Specter',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&id=5',
    rating: 4.79,
    punctuality: 92,
    onDuty: false,
    totalTrips: 512
  }
];

const getRankStyles = (index) => {
  if (index === 0) return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20';
  if (index === 1) return 'bg-gray-400/10 text-gray-600 border border-gray-400/20';
  if (index === 2) return 'bg-orange-400/10 text-orange-600 border border-orange-400/20';
  return 'text-gray-400';
};
</script>

<style scoped>
@reference "tailwindcss";

.card-premium {
  @apply bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300;
}
</style>
