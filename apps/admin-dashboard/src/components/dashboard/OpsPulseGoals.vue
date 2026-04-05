<template>
  <div class="mt-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-10">
      <div>
        <h3 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
          <LucideIcon name="Zap" class="text-primary animate-bounce-slow" :size="24" />
          Daily Ops Pulse
        </h3>
        <p class="text-sm text-gray-400 font-medium mt-1">
          Real-time tracking of daily business milestones and targets
        </p>
      </div>
      
      <div class="flex items-center gap-2 bg-primary/5 dark:bg-primary/20 px-4 py-2 rounded-2xl border border-primary/20">
        <LucideIcon name="TrendingUp" :size="16" class="text-primary" />
        <span class="text-xs font-black text-primary uppercase tracking-widest">+12.5% vs yesterday</span>
      </div>
    </div>

    <!-- Goals Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Revenue Goal -->
      <div class="pulse-card group">
        <div class="relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden h-full">
          <!-- Background Glow -->
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>
          
          <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Daily Revenue</h4>
          
          <!-- Circular Progress -->
          <div class="relative w-40 h-40 mb-8">
            <svg class="w-full h-full" viewBox="0 0 100 100">
              <circle class="text-gray-100 dark:text-gray-700" stroke-width="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
              <circle 
                class="text-primary transition-all duration-1000 ease-out stroke-linecap-round" 
                stroke-width="8" 
                :stroke-dasharray="2 * Math.PI * 40" 
                :stroke-dashoffset="2 * Math.PI * 40 * (1 - 0.82)" 
                stroke="currentColor" 
                fill="transparent" 
                r="40" cx="50" cy="50" 
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-black text-gray-800 dark:text-white">$4.2k</span>
              <span class="text-[10px] font-bold text-gray-400">82% of target</span>
            </div>
          </div>

          <div class="mt-auto w-full text-center">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target: $5,200</p>
          </div>
        </div>
      </div>

      <!-- Bookings Goal -->
      <div class="pulse-card group">
        <div class="relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden h-full">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-500"></div>
          
          <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Daily Bookings</h4>
          
          <div class="relative w-40 h-40 mb-8">
            <svg class="w-full h-full" viewBox="0 0 100 100">
              <circle class="text-gray-100 dark:text-gray-700" stroke-width="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
              <circle 
                class="text-green-500 transition-all duration-1000 ease-out stroke-linecap-round" 
                stroke-width="8" 
                :stroke-dasharray="2 * Math.PI * 40" 
                :stroke-dashoffset="2 * Math.PI * 40 * (1 - 0.95)" 
                stroke="currentColor" 
                fill="transparent" 
                r="40" cx="50" cy="50" 
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-black text-gray-800 dark:text-white">512</span>
              <span class="text-[10px] font-bold text-green-500">Almost reached!</span>
            </div>
          </div>

          <div class="mt-auto w-full text-center">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target: 540 Bookings</p>
          </div>
        </div>
      </div>

      <!-- Satisfaction Goal -->
      <div class="pulse-card group">
        <div class="relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden h-full">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all duration-500"></div>
          
          <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Avg Satisfaction</h4>
          
          <div class="relative w-40 h-40 mb-8">
            <svg class="w-full h-full" viewBox="0 0 100 100">
              <circle class="text-gray-100 dark:text-gray-700" stroke-width="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
              <circle 
                class="text-pink-500 transition-all duration-1000 ease-out stroke-linecap-round" 
                stroke-width="8" 
                :stroke-dasharray="2 * Math.PI * 40" 
                :stroke-dashoffset="2 * Math.PI * 40 * (1 - 0.75)" 
                stroke="currentColor" 
                fill="transparent" 
                r="40" cx="50" cy="50" 
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-black text-gray-800 dark:text-white">4.8</span>
              <span class="text-[10px] font-bold text-gray-400">Targeting 5.0</span>
            </div>
          </div>

          <div class="mt-auto w-full text-center">
            <div class="flex items-center justify-center gap-1">
              <LucideIcon v-for="i in 5" :key="i" name="Star" :size="12" fill="currentColor" class="text-pink-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue';
</script>

<style scoped>
@reference "tailwindcss";

.pulse-card {
  @apply relative transition-all duration-500 h-full;
}

.pulse-card:hover {
  transform: translateY(-8px) scale(1.02);
}

.animate-bounce-slow {
  animation: bounce 3s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
  50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
}

.stroke-linecap-round {
  stroke-linecap: round;
}
</style>
