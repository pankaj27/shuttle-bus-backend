<template>
  <div class="login-view">
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Sign In</h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">Access the {{ siteName }} admin dashboard</p>
    </div>

    <a-form
      :model="formState"
      name="login"
      layout="vertical"
      @finish="onFinish"
    >
      <a-form-item
        label="Email Address"
        name="email"
        :rules="[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Please enter a valid email!' }]"
      >
        <a-input v-model:value="formState.email" placeholder="admin@shuttle.com" size="large">
          <template #prefix>
            <mail :size="18" class="text-gray-400" />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item
        label="Password"
        name="password"
        :rules="[{ required: true, message: 'Please input your password!' }]"
      >
        <a-input-password v-model:value="formState.password" placeholder="••••••••" size="large">
          <template #prefix>
            <lock :size="18" class="text-gray-400" />
          </template>
        </a-input-password>
      </a-form-item>

      <!-- <div class="flex items-center justify-between mb-8">
        <a-checkbox v-model:checked="formState.remember">Remember me</a-checkbox>
        <router-link :to="{ name: 'forgot-password' }" class="text-primary hover:underline font-medium">
          Forgot password?
        </router-link>
      </div> -->

      <a-form-item>
        <a-button type="primary" html-type="submit" block size="large" :loading="loading" class="h-12 text-lg">
          Sign In
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { Mail, Lock } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

const router = useRouter();
const authStore = useAuthStore();
const { generalSettings } = storeToRefs(authStore);
const defaultAppName = import.meta.env.VITE_APP_NAME || 'Jadliride';
const siteName = computed(() => generalSettings.value?.name || defaultAppName);

const loading = ref(false);

const formState = reactive({
  email: '',
  password: '',
  remember: true,
});

const onFinish = async (values) => {
  loading.value = true;
  
  try {
    const result = await authStore.login(values.email, values.password);
    
    if (result.success) {
      message.success('Login successful!');
      router.push({ name: 'dashboard' });
    } else {
      message.error(result.error || 'Login failed. Please check your credentials.');
    }
  } catch (error) {
    message.error('An unexpected error occurred. Please try again.');
    console.error('Login error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
@reference "tailwindcss";

:deep(.ant-input-affix-wrapper-lg) {
  @apply rounded-xl border-gray-200;
}
:deep(.ant-btn-primary) {
  @apply rounded-xl font-bold;
}
</style>
