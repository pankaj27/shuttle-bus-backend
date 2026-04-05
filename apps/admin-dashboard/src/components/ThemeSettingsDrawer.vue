<template>
  <a-drawer
    v-model:open="visible"
    title="Theme Settings"
    placement="right"
    :width="320"
    class="theme-settings-drawer"
  >
    <div class="settings-section">
      <h4 class="section-title">Appearance</h4>
      
      <!-- Dark Mode Toggle -->
      <div class="setting-item">
        <div class="setting-label">
          <component :is="themeStore.isDark ? Sun : Moon" :size="18" />
          <span>Dark Mode</span>
        </div>
        <a-switch v-model:checked="themeStore.isDark" />
      </div>
    </div>

    <a-divider />

    <div class="settings-section">
      <h4 class="section-title">Primary Color</h4>
      
      <!-- Color Presets -->
      <div class="color-presets">
        <div
          v-for="color in colorPresets"
          :key="color.value"
          class="color-preset"
          :class="{ active: themeStore.colorPrimary === color.value }"
          :style="{ backgroundColor: color.value }"
          @click="themeStore.updatePrimaryColor(color.value)"
        >
          <check v-if="themeStore.colorPrimary === color.value" :size="18" class="check-icon" />
        </div>
      </div>

      <!-- Custom Color Picker -->
      <div class="setting-item mt-4">
        <div class="setting-label">
          <palette :size="18" />
          <span>Custom Color</span>
        </div>
        <input
          type="color"
          v-model="themeStore.colorPrimary"
          class="color-picker"
        />
      </div>
    </div>

    <a-divider />

    <div class="settings-section">
      <h4 class="section-title">Interface</h4>
      
      <!-- Border Radius -->
      <div class="setting-item">
        <div class="setting-label">
          <square :size="18" />
          <span>Border Radius</span>
        </div>
        <span class="setting-value">{{ themeStore.borderRadius }}px</span>
      </div>
      <a-slider
        v-model:value="themeStore.borderRadius"
        :min="0"
        :max="16"
        :step="2"
      />

      <!-- Font Size -->
      <div class="setting-item mt-4">
        <div class="setting-label">
          <type :size="18" />
          <span>Font Size</span>
        </div>
        <span class="setting-value">{{ themeStore.fontSize }}px</span>
      </div>
      <a-slider
        v-model:value="themeStore.fontSize"
        :min="12"
        :max="18"
        :step="1"
      />

      <!-- Font Family -->
      <div class="setting-item mt-4">
        <div class="setting-label">
          <type :size="18" />
          <span>Font Family</span>
        </div>
      </div>
      <a-select
        v-model:value="themeStore.fontFamily"
        class="w-full"
        @change="themeStore.updateFontFamily"
      >
        <a-select-option value="'Inter', sans-serif">Inter (Modern)</a-select-option>
        <a-select-option value="'Montserrat', sans-serif">Montserrat (Elegant)</a-select-option>
        <a-select-option value="'Plus Jakarta Sans', sans-serif">Jakarta (Clean)</a-select-option>
        <a-select-option value="'Outfit', sans-serif">Outfit (Premium)</a-select-option>
        <a-select-option value="'Poppins', sans-serif">Poppins (Friendly)</a-select-option>
        <a-select-option value="'Public Sans', sans-serif">Public Sans (Pro)</a-select-option>
        <a-select-option value="'Work Sans', sans-serif">Work Sans (Bold)</a-select-option>
        <a-select-option value="'Open Sans', sans-serif">Open Sans (Classic)</a-select-option>
        <a-select-option value="'Lato', sans-serif">Lato (Soft)</a-select-option>
        <a-select-option value="'Roboto', sans-serif">Roboto (System)</a-select-option>
        <a-select-option value="system-ui, sans-serif">System UI</a-select-option>
      </a-select>
    </div>

    <a-divider />

    <!-- Reset Button -->
    <a-button block type="default" @click="resetTheme">
      <template #icon><rotate-ccw :size="16" /></template>
      Reset to Default
    </a-button>
  </a-drawer>
</template>

<script setup>
import { ref } from 'vue';
import { useThemeStore } from '@/stores/theme';
import { 
  Sun, 
  Moon, 
  Palette, 
  Square, 
  Type, 
  Check,
  RotateCcw
} from 'lucide-vue-next';

const themeStore = useThemeStore();
const visible = ref(false);

const colorPresets = [
  { name: 'Jadliride Gold', value: '#f0a50b' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Slate', value: '#64748b' },
];

const resetTheme = () => {
  themeStore.updatePrimaryColor('#f0a50b');
  themeStore.updateBorderRadius(6);
  themeStore.updateFontSize(14);
  themeStore.isDark = false;
};

const open = () => {
  visible.value = true;
};

const close = () => {
  visible.value = false;
};

defineExpose({ open, close });
</script>

<style scoped>
.settings-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #262626;
}

.dark .section-title {
  color: #e5e7eb;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #595959;
}

.dark .setting-label {
  color: #d1d5db;
}

.setting-value {
  font-size: 13px;
  color: #8c8c8c;
  font-weight: 500;
}

.dark .setting-value {
  color: #9ca3af;
}

.color-presets {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.color-preset {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-preset:hover {
  transform: scale(1.1);
}

.color-preset.active {
  border-color: #fff;
  box-shadow: 0 0 0 2px currentColor;
}

.check-icon {
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
}

.color-picker {
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
}

.dark .color-picker {
  border-color: #434343;
}

.mt-4 {
  margin-top: 16px;
}
</style>
