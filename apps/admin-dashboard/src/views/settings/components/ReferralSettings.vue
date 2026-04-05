<script setup>
import { ref, onMounted, computed } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import { useSettings } from '@/composables/useSettings';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { message, Modal } from 'ant-design-vue';

const authStore = useAuthStore();
const isDemo = computed(() => authStore.isDemo);
const { loading, fetchSettings, updateSettings } = useSettings();
const themeStore = useThemeStore();

// Store the raw settings array from the API
const settingsList = ref([]);

// Helper to find a setting by name and user_type
const getSetting = (name, userType = 'customer') => {
  return settingsList.value.find(s => s.name === name && s.user_type === userType);
};

// Computed properties for specific settings to bind to the UI
const customerDays = computed(() => getSetting('number_of_days', 'customer'));
const customerAmount = computed(() => getSetting('referral_amount', 'customer'));

onMounted(async () => {
  const data = await fetchSettings('refferal');
  if (data && Array.isArray(data)) {
    settingsList.value = data;
  }
});

const handleSave = async () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating referral settings is disabled in Demo Mode.',
    });
    return;
  }
  await updateSettings('refferal', settingsList.value);
};
</script>

<template>
  <div>
    <div 
      class="category-header transition-colors duration-300"
      :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-100'"
    >
      <div 
        class="icon-box transition-colors duration-300"
        :class="themeStore.isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-600'"
      >
        <LucideIcon name="Users" />
      </div>
      <div>
        <h3 
          class="text-xl font-bold transition-colors duration-300"
          :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
        >
          Referral Program
        </h3>
        <p 
          class="text-sm transition-colors duration-300"
          :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
        >
          Configure incentives and rules for user referrals.
        </p>
      </div>
    </div>

    <a-form layout="vertical" class="mt-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        <!-- Customer Settings -->
        <div 
          v-if="customerAmount" 
          class="platform-card transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'"
        >
          <a-form-item label="Customer Referral Amount">
            <template #extra>
              <span class="text-xs text-gray-400">Bonus amount for customer referrals.</span>
            </template>
            <a-input-number v-model:value="customerAmount.value" class="w-full" size="large" :min="0" :disabled="isDemo">
             <template #prefix><LucideIcon name="Gift" :size="16" class="text-green-500 mr-2" /></template>
            </a-input-number>
          </a-form-item>
        </div>

        <div 
          v-if="customerDays" 
          class="platform-card transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'"
        >
          <a-form-item label="Referral Validity (Days)">
            <template #extra>
              <span class="text-xs text-gray-400">Duration the referral link is valid.</span>
            </template>
             <a-input-number v-model:value="customerDays.value" class="w-full" size="large" :min="0" :precision="0" :disabled="isDemo">
              <template #prefix><LucideIcon name="Calendar" :size="16" class="text-green-500 mr-2" /></template>
            </a-input-number>
          </a-form-item>
        </div>

      </div>

      <!-- If no settings loaded -->
      <div v-if="settingsList.length === 0 && !loading" class="text-center py-8 text-gray-400">
        No referral settings found.
      </div>

      <div class="flex flex-col items-end mt-12">
        <a-alert
          v-if="isDemo"
          message="Demo Mode Active"
          description="Referral incentives and rules are locked in this demonstration."
          type="warning"
          show-icon
          class="mb-6 w-full md:w-auto"
        />
        <a-button v-if="!isDemo" type="primary" size="large" class="submit-btn bg-green-600 border-green-600 hover:bg-green-700 shadow-green-500/20" :loading="loading" @click="handleSave">
          Update Referral Program
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<style scoped>

</style>
