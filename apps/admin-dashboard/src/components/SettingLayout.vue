<script setup>
import LucideIcon from '@/components/LucideIcon.vue';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  menuItems: {
    type: Array,
    required: true,
  },
  activeKey: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:activeKey', 'change']);

const handleMenuClick = (key) => {
  emit('update:activeKey', key);
  emit('change', key);
};
</script>

<template>
  <div class="setting-layout">
    <!-- Header -->
    <div class="mb-6">
      <h2 
        class="text-3xl font-extrabold tracking-tight transition-colors duration-300"
        :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-900'"
      >{{ title }}</h2>
      <p 
        v-if="description" 
        class="mt-1 transition-colors duration-300"
        :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
      >{{ description }}</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-8 min-h-[600px]">
      <!-- Sidebar Navigation -->
      <div class="w-full lg:w-72 flex-shrink-0">
        <div 
          class="p-4 shadow-sm sticky top-8 transition-all duration-300"
          :class="themeStore.isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'"
          :style="{ borderRadius: `${themeStore.borderRadius * 5.3}px` }"
        >
          <nav class="space-y-2">
            <button
              v-for="item in menuItems"
              :key="item.key"
              @click="handleMenuClick(item.key)"
              class="w-full flex items-center gap-4 px-5 py-4 transition-all duration-300 text-sm font-medium group"
              :class="activeKey === item.key 
                ? 'text-white! translate-x-1' 
                : themeStore.isDark 
                  ? 'text-gray-400 hover:bg-gray-800/50' 
                  : 'text-gray-500 hover:bg-gray-50'"
              :style="{
                borderRadius: `${themeStore.borderRadius * 2.6}px`,
                backgroundColor: activeKey === item.key ? themeStore.colorAccent : 'transparent',
                boxShadow: activeKey === item.key ? `0 10px 15px -3px ${themeStore.colorAccent}4d` : 'none'
              }"
            >
              <LucideIcon :name="item.icon" :size="20" />
              <span>{{ item.label }}</span>
            </button>
          </nav>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1">
        <div 
          class="p-8 shadow-sm h-full relative overflow-hidden transition-all duration-300"
          :class="themeStore.isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'"
          :style="{ borderRadius: `${themeStore.borderRadius * 5.3}px` }"
        >
          <!-- Background Decoration -->
          <div 
            class="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full opacity-5 pointer-events-none blur-3xl transition-all duration-500"
            :style="{ backgroundColor: themeStore.colorPrimary }"
          ></div>
          
          <!-- Content Slot -->
          <div class="relative z-10">
            <slot :name="activeKey"></slot>
            <!-- Fallback support if named slots aren't used -->
            <slot v-if="!$slots[activeKey]"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.setting-layout {
  @apply min-h-screen bg-transparent p-2;
}
</style>
