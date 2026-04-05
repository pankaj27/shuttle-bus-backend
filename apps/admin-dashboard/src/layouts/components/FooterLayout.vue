<template>
  <a-layout-footer 
    class="footer-container" 
    :style="{ 
      backgroundColor: isDark ? '#111827' : 'transparent', 
      color: isDark ? '#9ca3af' : 'rgba(0, 0, 0, 0.45)' 
    }"
  >
    {{ appName }} Admin ©{{ year }}
  </a-layout-footer>
</template>

<script setup>

import { useThemeStore } from '@/stores/theme';
import { storeToRefs } from 'pinia';
const year = new Date().getFullYear();
const appName = import.meta.env.VITE_APP_NAME || 'Jadliride';
const { isDark } = storeToRefs(useThemeStore());

</script>

<style scoped>
.footer-container {
  text-align: center;
  padding: 16px 24px;
  font-size: 14px;
}
</style>
