<script setup>
import { reactive, onMounted, computed, ref } from 'vue';
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
  id: '',
  otp_validation_via: false,
  firebase_database_url: '',
  firebase_key: null,
  firebase_credential: null,
});

const firebaseCredentialFileInput = ref(null);
const firebaseCredentialFileName = ref('');

onMounted(async () => {
  const data = await fetchSettings('notifications');
  if (data) {
    Object.assign(form, data);
    if (data.firebase_credential) {
      firebaseCredentialFileName.value = 'Credentials configured';
    }
  }
});

const openFirebaseCredentialPicker = () => {
  if (authStore.isDemo) return;
  firebaseCredentialFileInput.value?.click();
};

const onFirebaseCredentialSelected = async (e) => {
  const file = e?.target?.files?.[0];
  if (!file) return;
  firebaseCredentialFileName.value = file.name;

  try {
    const text = await file.text();
    form.firebase_credential = JSON.parse(text);
  } catch (err) {
    form.firebase_credential = null;
    firebaseCredentialFileName.value = '';
    Modal.error({
      title: 'Invalid JSON',
      content: 'Please upload a valid Firebase Admin SDK JSON file.',
    });
  } finally {
    if (firebaseCredentialFileInput.value) firebaseCredentialFileInput.value.value = '';
  }
};

const handleSave = async () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating notification settings is disabled in Demo Mode.',
    });
    return;
  }
  await updateSettings('notifications', form);
};
</script>

<template>
  <div>
    <div class="category-header">
      <div class="icon-box bg-orange-50 text-orange-600">
        <LucideIcon name="Bell" />
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800">Notification & Firebase</h3>
        <p class="text-sm text-gray-500">Configure OTP validation and push notification services.</p>
      </div>
    </div>

    <a-form layout="vertical" class="mt-8">
      <!-- <div class="maintenance-banner mb-8">
        <div class="flex items-center gap-4">
          <div class="banner-icon text-orange-600 bg-orange-50">
            <LucideIcon name="ShieldCheck" />
          </div>
          <div>
            <h4 class="font-bold text-orange-900">OTP Validation</h4>
            <p class="text-sm text-orange-700">Enable OTP validation via Firebase phone authentication.</p>
          </div>
        </div>
        <a-switch v-model:checked="form.otp_validation_via" />
      </div> -->

      <div class="platform-card bg-gray-50/50 border-gray-100">
        <h4 class="font-bold text-gray-800 mb-6 flex items-center gap-2">
          <LucideIcon name="Flame" :size="18" class="text-red-500" /> Firebase Configuration
        </h4>
        
        <a-form-item label="Firebase Database URL">
          <a-input v-model:value="form.firebase_database_url" placeholder="https://your-project.firebaseio.com" size="large" :disabled="authStore.isDemo" />
        </a-form-item>

        <a-form-item label="Firebase Admin SDK (JSON)">
          <input
            ref="firebaseCredentialFileInput"
            type="file"
            accept="application/json,.json"
            class="hidden"
            @change="onFirebaseCredentialSelected"
          />
          <div
            class="upload-zone group"
            :class="{ 'opacity-50 cursor-not-allowed pointer-events-none': authStore.isDemo }"
            @click="openFirebaseCredentialPicker"
          >
            <div class="upload-preview">
              <LucideIcon name="FileJson" class="text-gray-300" :size="32" />
            </div>
            <div>
              <p class="font-bold text-gray-700">Upload Credentials</p>
              <p class="text-xs text-gray-500 mt-1">Generate private key from Firebase Console.</p>
              <p v-if="firebaseCredentialFileName" class="text-xs text-gray-600 mt-2">
                {{ firebaseCredentialFileName }}
              </p>
            </div>
          </div>
        </a-form-item>
      </div>

      <div class="flex flex-col items-end mt-12">
        <a-alert
          v-if="isDemo"
          message="Demo Mode Active"
          description="Notification and Firebase server configurations are locked in this demonstration."
          type="warning"
          show-icon
          class="mb-6 w-full md:w-auto"
        />
        <a-button v-if="!isDemo" type="primary" size="large" class="submit-btn" :loading="loading" @click="handleSave">
          Update Notification Settings
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

.platform-card {
  @apply p-6 rounded-3xl border;
}

.maintenance-banner {
  @apply p-6 bg-orange-50/30 rounded-3xl border border-orange-100 flex items-center justify-between;
}

.banner-icon {
  @apply w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm;
}

.upload-zone {
  @apply flex items-center gap-6 p-6 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer;
}

.upload-preview {
  @apply w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300;
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

:deep(.ant-switch-checked) {
  @apply bg-blue-600;
}
</style>
