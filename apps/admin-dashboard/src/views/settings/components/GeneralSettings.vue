<script setup>
import { reactive, onMounted, ref, computed } from 'vue'
import '@vuelor/picker/style.css'
import {
  ColorPickerRoot,
  ColorPickerCanvas,
  ColorPickerSliderHue,
  ColorPickerSliderAlpha,
  ColorPickerInputHex
} from '@vuelor/picker'
import LucideIcon from '@/components/LucideIcon.vue'
import { useSettings } from '@/composables/useSettings'
import { useThemeStore } from '@/stores/theme'
import timezones from 'timezones-list'
import { countryService } from '@/services/country.service'
import { currencyService } from '@/services/currency.service'
import dateFormats from '@/constants/dateFormat'
import timeFormats from '@/constants/timeFormat'
import FileUpload from '@/components/FileUpload.vue'
import { useAuthStore } from '@/stores/auth'
import { Modal } from 'ant-design-vue'

const authStore = useAuthStore()
const isDemo = computed(() => authStore.isDemo)

const timezonesList = timezones
const countries = ref([])
const currencies = ref([])

const { loading, fetchSettings, updateSettings } = useSettings()
const themeStore = useThemeStore()
const activeKey = ref('1')

const form = reactive({
  dark_logo: '',
  light_logo: '',
  theme_mode: 'light',
  app_url: '',
  name: '',
  site_description: '',
  primary_color: '#1C2A3A',
  accent_color: '#F4A632',
  email: '',
  address: '',
  phone: '',
  default_country: '',
  default_currency: '',
  date_format: '',
  time_format: '',
  timezone: '',
  google_key: '',
  fee: '',
  fee_type: 'percentage',
  tax: '',
  api_base_url: '',
  logo: '',
  favicon: '',
})

onMounted(async () => {
  const [settingsData, countriesData, currenciesData] = await Promise.all([
    fetchSettings('general'),
    countryService.getList(),
    currencyService.getList(),
  ])

  if (settingsData) {
    Object.assign(form, settingsData)

    // Sync theme settings with theme store when data is loaded
    if (settingsData.primary_color) {
      themeStore.updatePrimaryColor(settingsData.primary_color)
    }
    if (settingsData.theme_mode) {
      themeStore.updateThemeMode(settingsData.theme_mode === 'dark')
    }
  }

  if (countriesData?.data) {
    countries.value = countriesData.data.map((v) => {
      return {
        label: v.label,
        value: v.short_name,
      }
    })
  }

  if (currenciesData?.data) {
    currencies.value = currenciesData.data
  }
})

const handleSave = async () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating general settings is disabled in Demo Mode.',
    });
    return;
  }
  const success = await updateSettings('general', form)
  if (success) {
    // Update theme store with new settings
    themeStore.updatePrimaryColor(form.primary_color)
    themeStore.updateThemeMode(form.theme_mode === 'dark')
  }
}
</script>

<template>
  <div>
    <div class="category-header">
      <div
        class="icon-box transition-colors duration-300"
        :class="themeStore.isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'"
      >
        <LucideIcon name="Settings" />
      </div>
      <div>
        <h3
          class="text-xl font-bold transition-colors duration-300"
          :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
        >
          General Configuration
        </h3>
        <p
          class="text-sm transition-colors duration-300"
          :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
        >
          Master settings for site identity, localization, and operations.
        </p>
      </div>
    </div>

    <a-form layout="vertical" class="mt-8">
      <a-tabs v-model:activeKey="activeKey" class="custom-tabs">
        <!-- Tab 1: General Info -->
        <a-tab-pane key="1">
          <template #tab>
            <span class="flex items-center gap-2">
              <LucideIcon name="Info" :size="16" /> General
            </span>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <a-form-item label="Site Name">
              <a-input v-model:value="form.name" :disabled="isDemo" />
            </a-form-item>
            <a-form-item label="Support Email">
              <a-input v-model:value="form.email" :disabled="isDemo" />
            </a-form-item>
            <a-form-item label="Support Phone">
              <a-input v-model:value="form.phone" :disabled="isDemo" />
            </a-form-item>
            <a-form-item label="App URL">
              <a-input v-model:value="form.app_url" :disabled="isDemo" />
            </a-form-item>
            <div class="md:col-span-2">
              <a-form-item label="Site Description">
                <a-textarea v-model:value="form.site_description" :rows="3" :disabled="isDemo" />
              </a-form-item>
            </div>
            <div class="md:col-span-2">
              <a-form-item label="Office Address">
                <a-textarea v-model:value="form.address" :rows="3" :disabled="isDemo" />
              </a-form-item>
            </div>
          </div>
        </a-tab-pane>

        <!-- Tab 2: Assets -->
        <a-tab-pane key="2">
          <template #tab>
            <span class="flex items-center gap-2">
              <LucideIcon name="Image" :size="16" /> Assets
            </span>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <a-form-item label="Light Logo">
              <FileUpload
                v-model:value="form.light_logo"
                folder="settings"
                helpText="For dark backgrounds"
                :disabled="isDemo"
              />
            </a-form-item>
            <a-form-item label="Dark Logo">
              <FileUpload
                v-model:value="form.dark_logo"
                folder="settings"
                helpText="For light backgrounds"
                :disabled="isDemo"
              />
            </a-form-item>
            <a-form-item label="Favicon">
              <FileUpload
                v-model:value="form.favicon"
                folder="settings"
                height="50px"
                width="50px"
                helpText="32x32px recommended"
                :disabled="isDemo"
              />
            </a-form-item>
            <a-form-item label="Main Brand Logo">
              <FileUpload
                v-model:value="form.logo"
                folder="settings"
                helpText="Master brand asset"
                :disabled="isDemo"
              />
            </a-form-item>
          </div>
        </a-tab-pane>

        <!-- Tab 3: System & Localization -->
        <a-tab-pane key="3">
          <template #tab>
            <span class="flex items-center gap-2">
              <LucideIcon name="Globe" :size="16" /> System
            </span>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <a-form-item label="Default Country">
              <a-select
                :options="countries"
                v-model:value="form.default_country"
                show-search
                placeholder="Select Country"
                option-filter-prop="children"
                :disabled="isDemo"
              >
              </a-select>
            </a-form-item>
            <a-form-item label="Default Currency">
              <a-select
                :options="currencies"
                v-model:value="form.default_currency"
                show-search
                placeholder="Select Currency"
                option-filter-prop="children"
                :disabled="isDemo"
              >
              </a-select>
            </a-form-item>
            <a-form-item label="Timezone">
              <a-select
                v-model:value="form.timezone"
                show-search
                placeholder="Select Timezone"
                option-filter-prop="children"
                :disabled="isDemo"
              >
                <a-select-option v-for="tz in timezonesList" :key="tz.tzCode" :value="tz.tzCode">
                  {{ tz.label }}
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="Date Format">
              <a-select
                :options="dateFormats"
                v-model:value="form.date_format"
                show-search
                placeholder="Select Date Format"
                :disabled="isDemo"
              >
              </a-select>
            </a-form-item>

            <a-form-item label="Time Format">
              <a-select
                :options="timeFormats"
                v-model:value="form.time_format"
                show-search
                placeholder="Select Time Format"
                :disabled="isDemo"
              >
              </a-select>
            </a-form-item>
            <a-form-item label="Primary Color">
              <div class="flex items-center gap-4">
                <a-popover trigger="click" placement="bottomLeft" :disabled="isDemo">
                  <template #content>
                    <div class="p-1">
                      <ColorPickerRoot v-model="form.primary_color" format="hex" styling="vanillacss">
                        <ColorPickerCanvas class="w-full h-40 rounded-md mb-3" />
                        <div class="space-y-3">
                          <ColorPickerSliderHue class="h-3 cursor-pointer" />
                          <ColorPickerSliderAlpha class="h-3 cursor-pointer" />
                          <ColorPickerInputHex class="mt-2" />
                        </div>
                      </ColorPickerRoot>
                    </div>
                  </template>
                  <div
                    class="w-12 h-12 rounded-xl border border-gray-200 shadow-sm transition-transform active:scale-95 hover:border-primary"
                    :class="isDemo ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
                    :style="{ backgroundColor: form.primary_color }"
                  ></div>
                </a-popover>
                <a-input v-model:value="form.primary_color" class="flex-1 uppercase" placeholder="#000000" :disabled="isDemo" />
              </div>
            </a-form-item>
            <a-form-item label="Accent Color">
              <div class="flex items-center gap-4">
                <a-popover trigger="click" placement="bottomLeft" :disabled="isDemo">
                  <template #content>
                    <div class="p-1">
                      <ColorPickerRoot v-model="form.accent_color" format="hex" styling="vanillacss">
                        <ColorPickerCanvas class="w-full h-40 rounded-md mb-3" />
                        <div class="space-y-3">
                          <ColorPickerSliderHue class="h-3 cursor-pointer" />
                          <ColorPickerSliderAlpha class="h-3 cursor-pointer" />
                          <ColorPickerInputHex class="mt-2" />
                        </div>
                      </ColorPickerRoot>
                    </div>
                  </template>
                  <div
                    class="w-12 h-12 rounded-xl border border-gray-200 shadow-sm transition-transform active:scale-95 hover:border-primary"
                    :class="isDemo ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
                    :style="{ backgroundColor: form.accent_color }"
                  ></div>
                </a-popover>
                <a-input v-model:value="form.accent_color" class="flex-1 uppercase" placeholder="#000000" :disabled="isDemo" />
              </div>
            </a-form-item>
            <a-form-item label="Default Theme Mode">
              <a-radio-group v-model:value="form.theme_mode" button-style="solid" class="w-full" :disabled="isDemo">
                <a-radio-button value="light" class="w-1/2 text-center">Light</a-radio-button>
                <a-radio-button value="dark" class="w-1/2 text-center">Dark</a-radio-button>
              </a-radio-group>
            </a-form-item>
          </div>
        </a-tab-pane>

        <!-- Tab 4: Business Logic -->
        <a-tab-pane key="4">
          <template #tab>
            <span class="flex items-center gap-2">
              <LucideIcon name="CreditCard" :size="16" /> Business
            </span>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <a-form-item label="Tax (%)">
              <a-input-number v-model:value="form.tax" class="w-full" :disabled="isDemo" />
            </a-form-item>
            <a-form-item label="Service Fee (%)">
              <a-radio-group v-model:value="form.fee_type" button-style="solid" class="w-full" :disabled="isDemo">
                <a-radio-button value="percentage" class="w-1/2 text-center"
                  >Percentage</a-radio-button
                >
                <a-radio-button value="fixed" class="w-1/2 text-center">Fixed</a-radio-button>
              </a-radio-group>
            </a-form-item>
            <a-form-item
              :label="form.fee_type === 'percentage' ? 'Service Fee (%)' : 'Service Fee (Fixed)'"
            >
              <a-input-number v-model:value="form.fee" class="w-full" :disabled="isDemo" />
            </a-form-item>
          </div>
        </a-tab-pane>

        <!-- Tab 6: Technical -->
        <a-tab-pane key="6">
          <template #tab>
            <span class="flex items-center gap-2">
              <LucideIcon name="Code" :size="16" /> Api Credentials
            </span>
          </template>
          <div class="grid grid-cols-1 gap-6 mt-4">
            <a-form-item label="Google API Key">
              <a-input-password v-model:value="form.google_key" :disabled="isDemo" />
            </a-form-item>
            <a-form-item label="API Base URL">
              <a-input v-model:value="form.api_base_url" placeholder="https://api.yourdomain.com" :disabled="isDemo" />
            </a-form-item>
          </div>
        </a-tab-pane>
      </a-tabs>

      <div class="flex flex-col items-end mt-12 border-t pt-8">
        <a-alert
          v-if="isDemo"
          message="Demo Mode Active"
          description="Some settings are restricted to maintain the stability of this public demonstration."
          type="warning"
          show-icon
          class="mb-6 w-full md:w-auto"
        />
        <a-button v-if="!isDemo" type="primary" class="submit-btn" :loading="loading" @click="handleSave">
          Save Changes
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.category-header {
  @apply flex items-center gap-4 pb-6 transition-colors duration-300;
}

:deep(.category-header) {
  border-bottom: 1px solid;
}

.setting-layout :deep(.category-header) {
  border-color: rgb(243 244 246);
}

:deep(.dark) .category-header,
html.dark .category-header {
  border-color: rgb(55 65 81);
}

.icon-box {
  @apply w-12 h-12 rounded-2xl flex items-center justify-center;
}

.submit-btn {
  @apply h-12 px-12 rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center;
}

:deep(.ant-input),
:deep(.ant-textarea),
:deep(.ant-input-password),
:deep(.ant-input-number),
:deep(.ant-select-selector) {
  @apply rounded-xl border-gray-200 transition-all duration-200 bg-gray-50/50;
  border-radius: 0.75rem !important;
  background-color: rgb(249 250 251 / 0.5) !important;
}

:deep(.ant-input:hover),
:deep(.ant-input:focus),
:deep(.ant-textarea:hover),
:deep(.ant-textarea:focus),
:deep(.ant-select-selector:hover) {
  @apply border-blue-400 ring-4 ring-blue-50 bg-white;
  background-color: #ffffff !important;
}

:deep(.ant-form-item-label > label) {
  @apply text-sm font-bold text-gray-600 mb-1;
}

:deep(.custom-tabs .ant-tabs-nav) {
  @apply mb-0;
}

:deep(.custom-tabs .ant-tabs-tab) {
  @apply py-4 px-2 text-gray-500 font-medium transition-all;
}

:deep(.custom-tabs .ant-tabs-tab-active) {
  @apply text-blue-600;
}

:deep(.custom-tabs .ant-tabs-tab:hover) {
  @apply text-blue-500;
}
</style>
