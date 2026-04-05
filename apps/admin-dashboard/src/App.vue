<template>
  <a-config-provider :theme="themeStore.themeConfig">
    <div :class="{ 'dark': themeStore.isDark }">
      <RouterView />
    </div>
  </a-config-provider>
</template>

<script setup>
import { RouterView } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

const themeStore = useThemeStore()
const authStore = useAuthStore()
const { isDark } = storeToRefs(themeStore)

// Initialize theme from general settings on app load
onMounted(() => {
  const generalSettings = authStore.generalSettings
  if (generalSettings) {
    if (generalSettings.primary_color) {
      themeStore.updatePrimaryColor(generalSettings.primary_color)
    }
    if (generalSettings.theme_mode) {
      themeStore.updateThemeMode(generalSettings.theme_mode === 'dark')
    }
  }
})

// Watch for changes in general settings and sync to theme store
watch(() => authStore.generalSettings, (newSettings) => {
  if (newSettings) {
    if (newSettings.primary_color) {
      themeStore.updatePrimaryColor(newSettings.primary_color)
    }
    if (newSettings.theme_mode) {
      themeStore.updateThemeMode(newSettings.theme_mode === 'dark')
    }
  }
}, { deep: true })

// Add/remove dark class to document element for global dark mode
watch(isDark, (val) => {
  if (val) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}, { immediate: true })

// Sync border radius to CSS variables for custom Tailwind utilities
watch(() => themeStore.borderRadius, (val) => {
  document.documentElement.style.setProperty('--radius-base', `${val}px`);
  document.documentElement.style.setProperty('--radius-secondary', `${val * 1.5}px`);
  document.documentElement.style.setProperty('--radius-premium', `${val * 2.5}px`);
}, { immediate: true })

// Sync font family to global variable and load from Google Fonts if needed
watch(() => themeStore.fontFamily, (val) => {
  document.documentElement.style.setProperty('--font-family-base', val);
  
  // Extract clean font name (e.g. "Plus Jakarta Sans" from "'Plus Jakarta Sans', sans-serif")
  const fontName = val.split(',')[0].replace(/'/g, '').trim();
  const fontId = `google-font-${fontName.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Only inject if not already present and not a system font
  if (fontName && !document.getElementById(fontId) && !['system-ui', 'sans-serif', 'serif', 'monospace'].includes(fontName.toLowerCase())) {
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    const encodedName = fontName.replace(/\s+/g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${encodedName}:wght@400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
  }
}, { immediate: true })

// Sync NProgress color to primary color
watch(() => themeStore.colorPrimary, (val) => {
  document.documentElement.style.setProperty('--nprogress-color', val);
}, { immediate: true })
</script>

<style>
/* Global resets if needed */
body {
  margin: 0;
  padding: 0;
}

/* NProgress Customization */
#nprogress .bar {
  background: var(--nprogress-color) !important;
  height: 3px !important;
}

#nprogress .peg {
  box-shadow: 0 0 10px var(--nprogress-color), 0 0 5px var(--nprogress-color) !important;
}

#nprogress .spinner-icon {
  border-top-color: var(--nprogress-color) !important;
  border-left-color: var(--nprogress-color) !important;
}
</style>
