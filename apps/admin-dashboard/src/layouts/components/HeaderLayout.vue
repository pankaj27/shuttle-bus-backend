<template>
  <a-layout-header class="header-container" :class="{ 'dark': isDark }">
    <div class="header-inner flex items-center justify-between w-full h-full px-6">
      <div class="header-left flex items-center gap-4">
        <a-button 
          type="text" 
          class="flex items-center justify-center p-0 w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
          @click="$emit('update:collapsed', !collapsed)"
        >
          <LucideIcon :name="collapsed ? 'PanelLeftOpen' : 'PanelLeftClose'" :size="20" class="text-gray-500 dark:text-gray-400" />
        </a-button>
        
        <a-breadcrumb class="hidden sm:block">
          <a-breadcrumb-item class="font-semibold text-gray-800 dark:text-gray-200">{{ currentPage }}</a-breadcrumb-item>
        </a-breadcrumb>

        <a-tag v-if="isDemo" color="error" class="demo-badge ml-2 font-bold border-none shadow-sm">
          DEMO MODE
        </a-tag>
      </div>

      <div class="header-right flex items-center gap-2 md:gap-5">
        <!-- Modern Search -->
        <!-- <div class="hidden md:flex items-center glass rounded-2xl px-3 py-1.5 border-gray-200 dark:border-gray-700 transition-all focus-within:ring-2 focus-within:ring-primary/20">
          <LucideIcon name="Search" :size="18" class="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search everything..." 
            class="bg-transparent border-none outline-none px-2 text-sm text-gray-700 dark:text-gray-300 w-48"
          />
          <span class="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">⌘K</span>
        </div> -->

        <div class="flex items-center gap-1">
          <ThemeSwitch />
          
          <a-tooltip title="Theme Settings">
            <a-button type="text" @click="openThemeSettings" class="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center justify-center p-0 w-10 h-10">
              <LucideIcon name="Settings" :size="20" class="text-gray-500 dark:text-gray-400" />
            </a-button>
          </a-tooltip>

          <!-- <a-dropdown :trigger="['click']" placement="bottomRight">
            <a-badge :count="5" :offset="[-2, 2]" class="cursor-pointer">
              <div class="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center justify-center w-10 h-10 transition-colors">
                <LucideIcon name="Bell" :size="20" class="text-gray-500 dark:text-gray-400" />
              </div>
            </a-badge>
            <template #overlay>
              <a-menu class="notification-dropdown rounded-2xl shadow-xl border-none p-2 mt-2 w-80">
                <div class="px-4 py-3 border-b border-gray-50 dark:border-gray-800 mb-2">
                  <h4 class="font-bold text-gray-900 dark:text-white">Notifications</h4>
                </div>
                <a-menu-item key="1" class="rounded-xl! p-3!">
                  <div class="flex gap-3">
                    <div class="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></div>
                    <div>
                      <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">New driver approved</p>
                      <p class="text-xs text-gray-400 mt-1">Michael Scott joined the fleet</p>
                    </div>
                  </div>
                </a-menu-item>
                <a-menu-divider />
                <div class="p-2">
                  <a-button block type="link" class="text-xs font-bold text-primary">View All Notifications</a-button>
                </div>
              </a-menu>
            </template>
          </a-dropdown> -->
        </div>
      </div>
    </div>
    
    <ThemeSettingsDrawer ref="themeSettingsDrawer" />
  </a-layout-header>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import ThemeSwitch from '@/components/ThemeSwitch.vue';
import ThemeSettingsDrawer from '@/components/ThemeSettingsDrawer.vue';
import { useThemeStore } from '@/stores/theme';
import { storeToRefs } from 'pinia';

const route = useRoute();
const authStore = useAuthStore();
const isDemo = computed(() => authStore.isDemo);
const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);
const themeSettingsDrawer = ref(null);

const currentPage = computed(() => {
  return route.name ? route.name.charAt(0).toUpperCase() + route.name.slice(1) : 'Dashboard';
});

defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update:collapsed']);

const openThemeSettings = () => {
  themeSettingsDrawer.value?.open();
};
</script>

<style scoped>
@reference "tailwindcss";

.header-container {
  @apply p-0 flex items-center z-50 transition-all duration-300;
  height: 72px;
  line-height: normal;
}
</style>

<style>
/* Unscoped styles for global consistency */
.header-container {
  background-color: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.dark .header-container {
  background-color: rgba(17, 24, 39, 0.8) !important;
  border-bottom-color: rgba(255, 255, 255, 0.05) !important;
}

.rounded-xl\! {
  border-radius: 12px !important;
}

.p-3\! {
  padding: 12px !important;
}

.ant-dropdown-menu {
  @apply overflow-hidden;
}

.dark .ant-dropdown-menu {
  background-color: #1f2937 !important;
  border: 1px solid #374151 !important;
}

.demo-badge {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  background-color: #ff4d4f !important;
  color: white !important;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 11px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
