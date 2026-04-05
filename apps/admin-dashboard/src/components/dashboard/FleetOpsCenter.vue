<template>
  <div class="mt-8">
    <!-- View Switcher Tabs -->
    <div class="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 px-2">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-primary/10 text-primary rounded-2xl shadow-inner">
          <LucideIcon :name="activeTabIcon" :size="24" class="animate-pulse" />
        </div>
        <div>
          <h3 class="text-2xl font-black text-gray-800 dark:text-white leading-tight">
            Fleet Ops Center
          </h3>
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            Real-time Operational Intelligence
          </p>
        </div>
      </div>

      <!-- Luxury Toggle HUD -->
      <div class="flex p-1.5 bg-white dark:bg-gray-800 rounded-3xl shadow-premium-sm border border-gray-100 dark:border-gray-700">
        <button 
          v-for="view in views" 
          :key="view.id"
          @click="activeView = view.id"
          class="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-500 hover:scale-105"
          :class="activeView === view.id 
            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-100' 
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'"
        >
          <LucideIcon :name="view.icon" :size="16" />
          <span class="hidden lg:inline">{{ view.name }}</span>
        </button>
      </div>
    </div>

    <!-- Active View Display with Transition -->
    <transition 
      name="view-fade" 
      mode="out-in"
    >
      <div :key="activeView">
        <FleetMonitorLite v-if="activeView === 'monitor'" :trips="trips" />
        <DispatcherTimeline v-else-if="activeView === 'timeline'" />
        <RoutePerformanceHUD v-else-if="activeView === 'performance'" />
        <DepartureBoard v-else-if="activeView === 'departures'" />
        <DriverLeaderboard v-else-if="activeView === 'leaderboard'" />
        <CustomerSentimentFeed v-else-if="activeView === 'feedback'" />
        <OpsPulseGoals v-else-if="activeView === 'pulse'" />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import FleetMonitorLite from './FleetMonitorLite.vue';
import DispatcherTimeline from './DispatcherTimeline.vue';
import RoutePerformanceHUD from './RoutePerformanceHUD.vue';
import DepartureBoard from './DepartureBoard.vue';
import DriverLeaderboard from './DriverLeaderboard.vue';
import CustomerSentimentFeed from './CustomerSentimentFeed.vue';
import OpsPulseGoals from './OpsPulseGoals.vue';

const props = defineProps({
  trips: { type: Array, default: () => [] }
});

const activeView = ref('monitor');

const views = [
  { id: 'monitor', name: 'Live Monitor', icon: 'Navigation' },
  { id: 'timeline', name: 'Shift Timeline', icon: 'CalendarClock' },
  { id: 'performance', name: 'Profit HUD', icon: 'Flame' },
  { id: 'departures', name: 'Boarding', icon: 'Monitor' },
  { id: 'leaderboard', name: 'Leaderboard', icon: 'Trophy' },
  { id: 'feedback', name: 'Feedback', icon: 'MessageSquareHeart' },
  { id: 'pulse', name: 'Ops Pulse', icon: 'Zap' }
];

const activeTabIcon = computed(() => {
  return views.find(v => v.id === activeView.value)?.icon || 'Activity';
});
</script>

<style scoped>
@reference "tailwindcss";

.shadow-premium-sm {
  box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);
}

.dark .shadow-premium-sm {
  box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.4);
}

/* View Switch Transition */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.view-fade-enter-from {
  opacity: 0;
  transform: translateY(15px) scale(0.98);
}

.view-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(1.02);
}
</style>
