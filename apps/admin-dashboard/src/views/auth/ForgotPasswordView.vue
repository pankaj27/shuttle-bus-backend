<template>
  <div class="forgot-password-view">
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-900">Forgot Password</h2>
      <p class="text-gray-500 mt-2">Enter your email and we'll send you reset instructions.</p>
    </div>

    <a-form
      v-if="!submitted"
      :model="formState"
      layout="vertical"
      @finish="handleReset"
    >
      <a-form-item
        label="Email Address"
        name="email"
        :rules="[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Please enter a valid email!' }]"
      >
        <a-input v-model:value="formState.email" placeholder="Enter your email" size="large">
          <template #prefix>
            <mail :size="18" class="text-gray-400" />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item class="mt-8">
        <a-button type="primary" html-type="submit" block size="large" :loading="loading" class="h-12 font-bold">
          Send Reset Link
        </a-button>
      </a-form-item>

      <div class="text-center mt-6">
        <router-link :to="{ name: 'login' }" class="flex items-center justify-center gap-2 text-gray-500 hover:text-primary transition-colors font-medium">
          <arrow-left :size="16" />
          Back to login
        </router-link>
      </div>
    </a-form>

    <div v-else class="text-center py-6">
      <div class="bg-green-50 text-green-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
        <check-circle :size="40" />
      </div>
      <h3 class="text-2xl font-bold text-gray-900 mb-3">Check your email</h3>
      <p class="text-gray-500 mb-10 leading-relaxed">
        We've sent a password reset link to <br>
        <strong class="text-gray-900">{{ formState.email }}</strong>
      </p>
      
      <a-button type="default" block size="large" @click="submitted = false" class="h-12 rounded-xl border-gray-200">
        Resend Email
      </a-button>

      <router-link :to="{ name: 'login' }" class="flex items-center justify-center gap-2 mt-8 text-gray-500 hover:text-primary font-medium">
        <arrow-left :size="16" />
        Back to login
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-vue-next';

const loading = ref(false);
const submitted = ref(false);

const formState = reactive({
  email: '',
});

const handleReset = (values) => {
  loading.value = true;
  // Simulate API
  setTimeout(() => {
    loading.value = false;
    submitted.value = true;
  }, 1500);
};
</script>

<style scoped>
@reference "tailwindcss";

:deep(.ant-input-affix-wrapper-lg) {
  @apply rounded-xl border-gray-200;
}
:deep(.ant-btn-primary) {
  @apply rounded-xl;
}
</style>
