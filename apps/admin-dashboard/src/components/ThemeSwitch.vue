<template>
  <a-tooltip :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
    <a-button 
      type="text" 
      @click="toggleTheme"
      class="theme-switch-btn"
      :icon="isDark ? h(Sun) : h(Moon)"
    >
    </a-button>
  </a-tooltip>
</template>

<script setup>
import { h } from 'vue';
import { Sun, Moon } from 'lucide-vue-next';
import { useThemeStore } from '@/stores/theme';
import { storeToRefs } from 'pinia';

const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);

const toggleTheme = () => {
  themeStore.toggleDarkMode();
};
</script>

<style scoped>
.theme-switch-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.theme-switch-btn:hover {
  transform: rotate(180deg);
}
</style>
