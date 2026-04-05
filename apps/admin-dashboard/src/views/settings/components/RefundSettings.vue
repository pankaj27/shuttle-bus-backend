<script setup>
import { reactive, onMounted, computed } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import { useSettings } from '@/composables/useSettings';
import RichTextEditor from '@/components/RichTextEditor.vue';
import { useAuthStore } from '@/stores/auth';
import { Modal } from 'ant-design-vue';
import { useThemeStore } from '@/stores/theme';

const authStore = useAuthStore();
const isDemo = computed(() => authStore.isDemo);
const { loading, fetchSettings, updateSettings } = useSettings();
const themeStore = useThemeStore();

const form = reactive({
  id: '',
  type: 'percentage',
  amount: '',
  contents: '',
});

const typeOptions = [
  { label: 'Percentage (%)', value: 'percentage' },
  { label: 'Fixed Amount', value: 'number' },
];

onMounted(async () => {
  const data = await fetchSettings('refunds');
  if (data) {
    Object.assign(form, data);
  }
});

const handleSave = async () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating refund policy is disabled in Demo Mode.',
    });
    return;
  }
  await updateSettings('refunds', form);
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
        :class="themeStore.isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'"
      >
        <LucideIcon name="RotateCcw" />
      </div>
      <div>
        <h3 
          class="text-xl font-bold transition-colors duration-300"
          :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
        >
          Refund Policy
        </h3>
        <p 
          class="text-sm transition-colors duration-300"
          :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
        >
          Define cancellation charges and refund logic.
        </p>
      </div>
    </div>

    <a-form layout="vertical" class="mt-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div 
          class="platform-card transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'"
        >
          <a-form-item label="Refund Calculation Type">
            <a-radio-group v-model:value="form.type" button-style="solid" class="w-full flex" :disabled="isDemo">
              <a-radio-button v-for="opt in typeOptions" :key="opt.value" :value="opt.value" class="flex-1 text-center h-11 flex items-center justify-center">
                {{ opt.label }}
              </a-radio-button>
            </a-radio-group>
          </a-form-item>
        </div>

        <div 
          class="platform-card transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'"
        >
          <a-form-item label="Deduction Amount / Rate">
            <a-input v-model:value="form.amount" placeholder="Enter amount" size="large" :disabled="isDemo">
              <template #prefix>
                <LucideIcon v-if="form.type === 'percentage'" name="Percent" :size="16" class="text-red-500 mr-2" />
                <LucideIcon v-else name="IndianRupee" :size="16" class="text-red-500 mr-2" />
              </template>
            </a-input>
          </a-form-item>
        </div>
      </div>

      <div 
        class="platform-card mb-8 transition-colors duration-300"
        :class="themeStore.isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'"
      >
        <a-form-item label="Detailed Refund Policy (Displayed to Users)">
          <RichTextEditor
            v-model="form.contents"
            placeholder="Enter full refund policy text..."
            height="300"
            :disabled="isDemo"
          />
        </a-form-item>
      </div>

      <div class="flex flex-col items-end mt-12">
        <a-alert
          v-if="isDemo"
          message="Demo Mode Active"
          description="Refund logic and fee structures are locked in this demonstration."
          type="warning"
          show-icon
          class="mb-6 w-full md:w-auto"
        />
        <a-button v-if="!isDemo" type="primary" size="large" class="submit-btn bg-red-600 border-red-600 hover:bg-red-700 shadow-red-500/20" :loading="loading" @click="handleSave">
          Update Refund Policy
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<style scoped>

</style>
