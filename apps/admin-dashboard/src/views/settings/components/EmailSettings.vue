<script setup>
import { reactive, onMounted, computed } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import { useSettings } from '@/composables/useSettings';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { Modal } from 'ant-design-vue';

const authStore = useAuthStore();
const isDemo = computed(() => authStore.isDemo);
const themeStore = useThemeStore();

const { loading, fetchSettings, updateSettings } = useSettings();

const form = reactive({
  host: '',
  port: '',
  username: '',
  password: '',
  encryption: 'tls',
  from_address: '',
  from_name: '',
});

onMounted(async () => {
  const data = await fetchSettings('smtp');
  if (data) {
    Object.assign(form, data);
  }
});

const handleSave = async () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating SMTP settings is disabled in Demo Mode.',
    });
    return;
  }
  await updateSettings('smtp', form);
};
</script>

<template>
  <div>
    <div class="category-header">
      <div class="icon-box bg-indigo-50 text-indigo-600">
        <LucideIcon name="Mail" />
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800">Email (SMTP) Settings</h3>
        <p class="text-sm text-gray-500">Configure outbound email notifications.</p>
      </div>
    </div>

    <a-form layout="vertical" class="mt-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2">
          <a-form-item label="SMTP Host">
            <a-input v-model:value="form.host" size="large" :disabled="authStore.isDemo" />
          </a-form-item>
        </div>
        <a-form-item label="Port">
          <a-input v-model:value="form.port" size="large" :disabled="authStore.isDemo" />
        </a-form-item>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a-form-item label="Username">
          <a-input v-model:value="form.username" size="large" :disabled="authStore.isDemo" />
        </a-form-item>
        <a-form-item label="Password">
          <a-input-password v-model:value="form.password" size="large" :disabled="authStore.isDemo" />
        </a-form-item>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a-form-item label="From Name">
          <a-input v-model:value="form.from_name" size="large" :disabled="authStore.isDemo" />
        </a-form-item>
        <a-form-item label="From Address">
          <a-input v-model:value="form.from_address" size="large" :disabled="authStore.isDemo" />
        </a-form-item>
      </div>

      <div class="flex flex-col items-end mt-12">
        <a-alert
          v-if="isDemo"
          message="Demo Mode Active"
          description="Email server configurations are locked in this demonstration."
          type="warning"
          show-icon
          class="mb-6 w-full md:w-auto"
        />
        <a-button v-if="!isDemo" type="primary" size="large" class="submit-btn" :loading="loading" @click="handleSave">
          Save SMTP Settings
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.category-header {
  @apply flex items-center gap-4 border-b border-gray-100 pb-6;
}

.icon-box {
  @apply w-12 h-12 rounded-2xl flex items-center justify-center;
}

.submit-btn {
  @apply h-12 px-12 rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center;
}

:deep(.ant-input), :deep(.ant-textarea), :deep(.ant-input-password), :deep(.ant-input-number), :deep(.ant-select-selector) {
  @apply rounded-xl border-gray-200 transition-all duration-200 bg-gray-50/50;
  border-radius: 0.75rem !important;
  background-color: rgb(249 250 251 / 0.5) !important;
}

:deep(.ant-input:hover), :deep(.ant-input:focus), :deep(.ant-textarea:hover), :deep(.ant-textarea:focus), :deep(.ant-select-selector:hover) {
  @apply border-blue-400 ring-4 ring-blue-50 bg-white;
  background-color: #ffffff !important;
}

:deep(.ant-form-item-label > label) {
  @apply text-sm font-bold text-gray-600 mb-1;
}
</style>
