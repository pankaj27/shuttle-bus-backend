<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Security Settings</h2>
      <p class="text-gray-500">Update your account password to stay secure.</p>
    </div>

    <a-alert
      v-if="authStore.isDemo"
      message="Demo Mode Active"
      description="Security settings and password modifications are restricted in this demonstration."
      type="warning"
      show-icon
      class="mb-6 rounded-2xl shadow-sm ring-1 ring-amber-100"
    />

    <a-card :bordered="false" class="shadow-sm">
      <a-form
        :model="formState"
        layout="vertical"
        @finish="handleChangePassword"
        class="max-w-md"
      >
        <a-form-item
          label="Current Password"
          name="currentPassword"
          :rules="[{ required: true, message: 'Please input your current password!' }]"
        >
          <a-input-password v-model:value="formState.currentPassword" placeholder="••••••••" :disabled="authStore.isDemo">
            <template #prefix><shield-check :size="18" class="text-gray-400" /></template>
          </a-input-password>
        </a-form-item>

        <a-form-divider />

        <a-form-item
          label="New Password"
          name="newPassword"
          :rules="[
            { required: true, message: 'Please input your new password!' },
            { min: 8, message: 'Password must be at least 8 characters' }
          ]"
        >
          <a-input-password v-model:value="formState.newPassword" placeholder="Minimum 8 characters" :disabled="authStore.isDemo">
            <template #prefix><lock :size="18" class="text-gray-400" /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item
          label="Confirm New Password"
          name="confirmPassword"
          :rules="[
            { required: true, message: 'Please confirm your new password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords do not match!'));
              },
            }),
          ]"
        >
          <a-input-password v-model:value="formState.confirmPassword" placeholder="••••••••" :disabled="authStore.isDemo">
            <template #prefix><lock :size="18" class="text-gray-400" /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item class="mt-8">
          <a-button v-if="!authStore.isDemo" type="primary" html-type="submit" :loading="loading" size="large">
            Update Password
          </a-button>
          <a-button type="link" class="ml-4" @click="$router.back()">Cancel</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-alert
      message="Security Tip"
      description="Use a mix of letters, numbers, and symbols to create a strong password. Avoid using common words or birthday dates."
      type="info"
      show-icon
      class="mt-6"
    >
      <template #icon><info :size="20" /></template>
    </a-alert>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Lock, ShieldCheck, Info } from 'lucide-vue-next';
import { message, Modal } from 'ant-design-vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const loading = ref(false);

const formState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const handleChangePassword = (values) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating security credentials is disabled in Demo Mode.',
    });
    return;
  }
  loading.value = true;
  console.log('Password Update Request:', values);

  // Simulate API
  setTimeout(() => {
    loading.value = false;
    message.success('Password updated successfully!');
    formState.currentPassword = '';
    formState.newPassword = '';
    formState.confirmPassword = '';
  }, 1500);
};
</script>

<style scoped>
@reference "tailwindcss";

:deep(.ant-card) {
  @apply rounded-xl;
}

:deep(.ant-input-password) {
  @apply h-11 flex items-center;
}
</style>
