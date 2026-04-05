<template>
  <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div class="space-y-1">
      <h1 :style="{ color: isDark ? '#ffffff' : '#000' }" class="text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-none">
        Welcome back, <span class="gradient-text italic">{{ role }}</span>
      </h1>
   <p class="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 flex-wrap">
      <span class="capitalize">{{ today }}</span>
      </p> 
    </div>
    <!-- <div class="flex items-center gap-4">
      <a-range-picker :bordered="false" class="glass rounded-2xl px-4 py-2 shadow-sm border-gray-100/50" />
      <a-button type="primary" class="rounded-2xl flex items-center gap-2 h-12 px-6 shadow-xl shadow-primary/30 transition-all hover:scale-105">
        <Download :size="16" />
        <span class="font-bold">Export Reports</span>
      </a-button>
    </div> -->
  </div>
</template>

<script setup>
// import { Download } from 'lucide-vue-next';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);

const today = dayjs().format('dddd, DD MMMM YYYY');

defineProps({
  role: {
    type: String,
    default: 'Admin'
  },
  appName: {
    type: String,
    default: 'Jadliride'
  }
});
</script>
