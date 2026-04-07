<script setup>
import { reactive, onMounted, computed, watch } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import { useSettings } from '@/composables/useSettings';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { Modal, message } from 'ant-design-vue';

const authStore = useAuthStore();
const isDemo = computed(() => authStore.isDemo);
const themeStore = useThemeStore();

const { loading, fetchSettings, updateSettings } = useSettings();

const form = reactive({
  name: '',
  msg91: {
    is_enabled: false,
    key: '',
    senderId: '',
    templates: [
      { id: '', message: '' }
    ]
  },
  twilio: {
    is_enabled: false,
    sid: '',
    token: '',
    phone_number: ''
  }
});

// Watch for provider toggles to enforce single selection and update name
watch(
  () => [ form.msg91.is_enabled, form.twilio.is_enabled],
  (newVals, oldVals) => {
    const [m, t] = newVals;
    const [om, ot] = oldVals || [false, false];

    // 1. Enforce mutual exclusion (only one active at a time)
    if (m && !om) {
      if (form.twilio.is_enabled) form.twilio.is_enabled = false;
    } else if (t && !ot) {
      if (form.msg91.is_enabled) form.msg91.is_enabled = false;
    }

    // 2. Update name based on enabled provider or reset
    if (!m && !t) {
      form.name = '';
    } else {
      if (m) form.name = 'Msg91';
      else if (t) form.name = 'Twilio';
    }
  },
  { deep: true }
);

onMounted(async () => {
  const data = await fetchSettings('sms');
  if (data) {
    // Merge data to preserve structure if some fields are missing
    if (data.name) form.name = data.name;
    if (data.msg91) {
      Object.assign(form.msg91, data.msg91);
      if (!form.msg91.templates || form.msg91.templates.length === 0) {
        form.msg91.templates = [{ id: '', message: '' }];
      }
    }
    if (data.twilio) Object.assign(form.twilio, data.twilio);
  }
});

const addTemplate = () => {
  form.msg91.templates.push({ id: '', message: '' });
};

const removeTemplate = (index) => {
  form.msg91.templates.splice(index, 1);
};

const handleSave = async () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating SMS settings is disabled in Demo Mode.',
    });
    return;
  }
  
  try {
    // Name and provider consistency is handled by the watch block
    const success = await updateSettings('sms', form);
    if (success) {
      // Success message is handled by the composable, but we can add specific logic here if needed
    }
  } catch (error) {
    message.error('Failed to update SMS settings');
  }
};
</script>

<template>
  <div class="sms-settings">
    <div class="category-header">
      <div class="icon-box bg-purple-50 text-purple-600">
        <LucideIcon name="MessageSquare" />
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800">SMS Gateway Settings</h3>
        <p class="text-sm text-gray-500">Configure multiple SMS providers for OTP and notifications.</p>
      </div>
    </div>

    <a-form layout="vertical" class="mt-8">
      <div class="mb-8 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
        <h4 class="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <LucideIcon name="Settings" size="18" /> General Configuration
        </h4>
        <a-form-item label="Default Configuration Name">
          <a-input readonly v-model:value="form.name" placeholder="e.g. Production SMS" size="large" :disabled="isDemo" />
        </a-form-item>
      </div>

      <div class="grid grid-cols-1 gap-8">
 

        <!-- Msg91 SMS -->
        <div class="provider-card border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all" :class="{ 'active-provider': form.msg91.is_enabled }">
          <div class="flex justify-between items-start mb-6">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <LucideIcon name="Zap" size="20" />
              </div>
              <div>
                <h4 class="font-bold text-gray-800">Msg91 Gateway</h4>
                <p class="text-xs text-gray-500">Tier-1 international SMS provider.</p>
              </div>
            </div>
            <a-switch v-model:checked="form.msg91.is_enabled" :disabled="isDemo" />
          </div>

          <div v-if="form.msg91.is_enabled" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a-form-item label="Auth Key">
                <a-input-password v-model:value="form.msg91.key" placeholder="Enter Msg91 key" size="large" :disabled="isDemo" />
              </a-form-item>
              <a-form-item label="Sender ID">
                <a-input v-model:value="form.msg91.senderId" placeholder="e.g. JaldiR" size="large" :disabled="isDemo" />
              </a-form-item>
            </div>

            <div class="mt-4">
              <div class="flex justify-between items-center mb-4">
                <h5 class="text-sm font-bold text-gray-600">SMS Templates</h5>
                <a-button type="dashed" size="small" @click="addTemplate" :disabled="isDemo">
                   Add Template
                </a-button>
              </div>
              <div v-for="(template, index) in form.msg91.templates" :key="index" class="template-item bg-gray-50 p-4 rounded-xl mb-4 relative">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <a-form-item label="Template ID" class="mb-0">
                    <a-input v-model:value="template.id" placeholder="ID" size="large" :disabled="isDemo" />
                  </a-form-item>
                  <a-form-item label="Message Body" class="md:col-span-2 mb-0">
                    <a-textarea v-model:value="template.message" placeholder="Message content" :rows="2" :disabled="isDemo" />
                  </a-form-item>
           
                </div>
                       <a-button 
                  v-if="form.msg91.templates.length > 1"
                  shape="circle"
                  danger 
                  @click="removeTemplate(index)"
                  :disabled="isDemo"
                >
                  <LucideIcon name="Trash" size="18" />
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Twilio SMS -->
        <div class="provider-card border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all" :class="{ 'active-provider': form.twilio.is_enabled }">
          <div class="flex justify-between items-start mb-6">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                <LucideIcon name="Phone" size="20" />
              </div>
              <div>
                <h4 class="font-bold text-gray-800">Twilio Support</h4>
                <p class="text-xs text-gray-500">Programmable messaging provider.</p>
              </div>
            </div>
            <a-switch v-model:checked="form.twilio.is_enabled" :disabled="isDemo" />
          </div>

          <div v-if="form.twilio.is_enabled" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a-form-item label="Account SID">
                <a-input v-model:value="form.twilio.sid" placeholder="AC..." size="large" :disabled="isDemo" />
              </a-form-item>
              <a-form-item label="Auth Token">
                <a-input-password v-model:value="form.twilio.token" placeholder="Token" size="large" :disabled="isDemo" />
              </a-form-item>
            </div>
            <a-form-item label="Phone Number">
              <a-input v-model:value="form.twilio.phone_number" placeholder="+1234567890" size="large" :disabled="isDemo" />
            </a-form-item>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-end mt-12">
        <a-alert
          v-if="isDemo"
          message="Demo Mode Active"
          description="SMS server configurations are locked in this demonstration."
          type="warning"
          show-icon
          class="mb-6 w-full md:w-auto shadow-sm"
        />
        <a-button v-if="!isDemo" type="primary" size="large" class="submit-btn" :loading="loading" @click="handleSave">
          Update SMS Configuration
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<style scoped lang="postcss">
@reference "tailwindcss";

.category-header {
  @apply flex items-center gap-4 border-b border-gray-100 pb-6;
}

.icon-box {
  @apply w-12 h-12 rounded-2xl flex items-center justify-center;
}

.submit-btn {
  @apply h-12 px-12 rounded-xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center;
}

.active-provider {
  @apply bg-blue-50/5 border-blue-100;
}

.template-item {
  @apply transition-all duration-300;
}

:deep(.ant-input), :deep(.ant-textarea), :deep(.ant-input-password), :deep(.ant-input-number), :deep(.ant-select-selector) {
  @apply rounded-xl border-gray-200 transition-all duration-200 bg-gray-50/50;
  border-radius: 0.75rem !important;
  background-color: rgb(249 250 251 / 0.5) !important;
}

:deep(.ant-input:hover), :deep(.ant-input:focus), :deep(.ant-textarea:hover), :deep(.ant-textarea:focus), :deep(.ant-select-selector:hover) {
  @apply border-purple-400 ring-4 ring-purple-50 bg-white;
  background-color: #ffffff !important;
}

:deep(.ant-form-item-label > label) {
  @apply text-sm font-bold text-gray-600 mb-1;
}

:deep(.ant-switch-checked) {
  @apply bg-purple-600;
}
</style>
