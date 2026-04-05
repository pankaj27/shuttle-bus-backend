<script setup>
import { ref, onMounted, computed } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import { useSettings } from '@/composables/useSettings';
import RichTextEditor from '@/components/RichTextEditor.vue';
import { useAuthStore } from '@/stores/auth';
import { Modal } from 'ant-design-vue';
import { useThemeStore } from '@/stores/theme';
import { message } from 'ant-design-vue';

const authStore = useAuthStore();
const isDemo = computed(() => authStore.isDemo);
const { loading, fetchSettings, updateSettings } = useSettings();
const themeStore = useThemeStore();

const form = ref('');

onMounted(async () => {
  const data = await fetchSettings('deleteaccount');
  if (data) {
     form.value = data
  }
});

const handleSave = async () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating account deletion instructions is disabled in Demo Mode.',
    });
    return;
  }
  await updateSettings('deleteaccount', {deleteaccount: form.value});
};

const getPublicLink = () => {
  const base = window.location.origin + window.location.pathname;
  return `${base}#/delete-account`;
};

const copyToClipboard = () => {
  const link = getPublicLink();
  navigator.clipboard.writeText(link).then(() => {
    message.success('Link copied to clipboard');
  });
};

const openPublicLink = () => {
  window.open(getPublicLink(), '_blank');
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
        :class="themeStore.isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'"
      >
        <LucideIcon name="Lock" />
      </div>
      <div>
        <h3 
          class="text-xl font-bold transition-colors duration-300"
          :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
        >
          Delete Account
        </h3>
        <p 
          class="text-sm transition-colors duration-300"
          :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
        >
          Manage how you collect and handle user data.
        </p>
      </div>
    </div>

    <a-form layout="vertical" class="mt-8">
      <div 
        class="platform-card mb-8 transition-colors duration-300"
        :class="themeStore.isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'"
      >
        <div class="flex justify-between items-center mb-6">
          <h4 
            class="font-bold flex items-center gap-2 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-800'"
          >
            <LucideIcon name="Shield" :size="18" /> Delete Account Document
          </h4>
          <div class="flex items-center gap-2">
            <div 
              class="px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-400 truncate max-w-[200px]"
              title="Public Link"
            >
              {{ getPublicLink() }}
            </div>
            <a-button type="primary" size="small" class="bg-blue-600 flex items-center gap-1 px-3" @click="copyToClipboard">
                <LucideIcon name="Copy" :size="14" /> Copy
            </a-button>
            <a-button type="link" class="text-blue-600 font-bold flex items-center gap-1" @click="openPublicLink">
                <LucideIcon name="Eye" :size="16" /> View Public Link
            </a-button>
          </div>
        </div>
        
        <a-form-item label="Delete Account Instructions">
          <RichTextEditor
            v-model="form"
            placeholder="Enter your privacy policy details..."
            height="500"
            :disabled="isDemo"
          />
        </a-form-item>
      </div>

      <div class="flex flex-col items-end mt-12">
        <a-alert
          v-if="isDemo"
          message="Demo Mode Active"
          description="Account deletion and data handling policies are locked in this demonstration."
          type="warning"
          show-icon
          class="mb-6 w-full md:w-auto"
        />
        <a-button v-if="!isDemo" type="primary" size="large" class="submit-btn bg-blue-600 border-blue-600 hover:bg-blue-700 shadow-blue-500/20" :loading="loading" @click="handleSave">
          Update Delete Account
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<style scoped>
</style>
