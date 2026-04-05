<script setup>
import { computed } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import { useThemeStore } from '@/stores/theme';

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
});

const themeStore = useThemeStore();

const successRate = computed(() => {
  const total = props.notification.send_total.success_count + props.notification.send_total.failed_count;
  if (total === 0) return 0;
  return Math.round((props.notification.send_total.success_count / total) * 100);
});

const scheduleLabel = computed(() => {
  const labels = {
    instant: 'Send Instantly',
    daily: 'Daily Schedule',
    weekly: 'Weekly Schedule',
    monthly: 'Monthly Schedule',
  };
  return labels[props.notification.schedule] || props.notification.schedule;
});
</script>

<template>
  <div class="space-y-8 pb-8">
    <!-- Header Section with Picture -->
    <div class="relative group">
      <div 
        v-if="notification.notification_picture" 
        class="w-full h-48 rounded-2xl overflow-hidden border shadow-sm transition-all duration-500"
        :class="themeStore.isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'"
      >
        <img 
          :src="notification.notification_picture" 
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          alt="Notification Image"
        />
        <div class="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span class="text-white text-xs font-medium uppercase tracking-wider italic">Notification Banner</span>
        </div>
      </div>
      <div 
        v-else 
        class="w-full h-32 rounded-2xl flex flex-col items-center justify-center border border-dashed transition-all duration-300"
        :class="themeStore.isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'"
      >
        <LucideIcon name="Image" :size="32" class="text-gray-300 mb-2" />
        <span class="text-xs text-gray-400">No Image Attached</span>
      </div>
    </div>

    <!-- Content Section -->
    <div class="space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <h2 
            class="text-2xl font-bold tracking-tight mb-2"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            {{ notification.notification_title }}
          </h2>
          <p 
            class="text-base leading-relaxed"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-600'"
          >
            {{ notification.notification_body }}
          </p>
        </div>
        <div class="shrink-0">
          <a-tag 
            color="blue" 
            class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
          >
            {{ notification.user_type }}
          </a-tag>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          class="p-4 rounded-2xl border transition-all duration-300"
          :class="themeStore.isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-100'"
        >
          <div class="flex items-center gap-2 mb-1">
            <LucideIcon name="Calendar" :size="14" class="text-blue-500" />
            <span class="text-[10px] uppercase font-bold text-gray-400">Schedule</span>
          </div>
          <div class="text-sm font-semibold">{{ scheduleLabel }}</div>
        </div>

        <div 
          class="p-4 rounded-2xl border transition-all duration-300"
          :class="themeStore.isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-100'"
        >
          <div class="flex items-center gap-2 mb-1">
            <LucideIcon name="Clock" :size="14" class="text-orange-500" />
            <span class="text-[10px] uppercase font-bold text-gray-400">Time</span>
          </div>
          <div class="text-sm font-semibold">{{ notification.time }}</div>
        </div>

        <div 
          class="p-4 rounded-2xl border transition-all duration-300"
          :class="themeStore.isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-100'"
        >
          <div class="flex items-center gap-2 mb-1">
            <LucideIcon name="CheckCircle2" :size="14" class="text-green-500" />
            <span class="text-[10px] uppercase font-bold text-gray-400">Success</span>
          </div>
          <div class="text-sm font-semibold text-green-600">{{ notification.send_total.success_count }}</div>
        </div>

        <div 
          class="p-4 rounded-2xl border transition-all duration-300"
          :class="themeStore.isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-100'"
        >
          <div class="flex items-center gap-2 mb-1">
            <LucideIcon name="AlertCircle" :size="14" class="text-red-500" />
            <span class="text-[10px] uppercase font-bold text-gray-400">Failed</span>
          </div>
          <div class="text-sm font-semibold text-red-500">{{ notification.send_total.failed_count }}</div>
        </div>
      </div>

      <!-- Reach Chart/Visual -->
      <div 
        class="p-6 rounded-3xl border shadow-sm relative overflow-hidden"
        :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
      >
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <LucideIcon name="BarChart3" :size="20" />
            </div>
            <h3 class="text-lg font-bold">Delivery Performance</h3>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-blue-600">{{ successRate }}%</div>
            <div class="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Success Rate</div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 italic">Success Delivery</span>
              <span class="font-bold">{{ notification.send_total.success_count }} users</span>
            </div>
            <a-progress 
              :percent="successRate" 
              status="active" 
              stroke-color="#2563eb"
              :show-info="false"
              class="custom-progress"
            />
          </div>
          <!-- <p class="text-xs text-gray-400 italic">
            Note: Stats are updated in real-time as notifications are being processed by the FCM server.
          </p> -->
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.custom-progress :deep(.ant-progress-inner) {
  @apply bg-gray-100 dark:bg-gray-700;
  height: 8px !important;
}

:deep(.ant-tag) {
  border: none;
  font-weight: 600;
}
</style>
