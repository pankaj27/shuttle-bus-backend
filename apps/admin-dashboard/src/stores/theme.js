import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { theme } from 'ant-design-vue'

export const useThemeStore = defineStore(
  'theme',
  () => {
    // State
    const colorPrimary = ref('#1C2A3A')
    const colorAccent = ref('#F4A632')
    const borderRadius = ref(6)
    const isDark = ref(false)
    const fontSize = ref(14)
    const fontFamily = ref("'Poppins', sans-serif")

    // Getters
    const themeConfig = computed(() => ({
      token: {
        colorPrimary: colorPrimary.value,
        borderRadius: borderRadius.value,
        fontFamily: fontFamily.value,
        fontSize: fontSize.value,
        colorBgContainer: isDark.value ? '#111827' : '#ffffff', // gray-900 vs white
        colorBorder: isDark.value ? '#374151' : '#e5e7eb', // gray-700 vs gray-200
        colorText: isDark.value ? '#f3f4f6' : '#1f2937', // gray-100 vs gray-800
        colorTextSecondary: isDark.value ? '#9ca3af' : '#6b7280', // gray-400 vs gray-500
      },
      algorithm: isDark.value ? theme.darkAlgorithm : theme.defaultAlgorithm,
    }))

    // Actions
    function toggleDarkMode() {
      isDark.value = !isDark.value
    }

    function updatePrimaryColor(color) {
      colorPrimary.value = color
    }

    function updateThemeMode(dark) {
      isDark.value = dark
    }

    function updateBorderRadius(radius) {
      borderRadius.value = radius
    }

    function updateFontSize(size) {
      fontSize.value = size
    }

    function updateFontFamily(family) {
      fontFamily.value = family
    }

    return {
      // State
      colorPrimary,
      colorAccent,
      borderRadius,
      isDark,
      fontSize,
      fontFamily,
      // Getters
      themeConfig,
      // Actions
      toggleDarkMode,
      updatePrimaryColor,
      updateBorderRadius,
      updateFontSize,
      updateFontFamily,
      updateThemeMode,
    }
  },
  {
    persist: true,
  },
)
