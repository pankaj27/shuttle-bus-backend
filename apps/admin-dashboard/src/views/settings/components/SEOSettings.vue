<script setup>
import { reactive, onMounted, computed } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import { useSettings } from '@/composables/useSettings';
import { useAuthStore } from '@/stores/auth';
import { Modal } from 'ant-design-vue';

const authStore = useAuthStore();
const isDemo = computed(() => authStore.isDemo);

const { loading, fetchSettings, updateSettings } = useSettings();

const form = reactive({
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  google_analytics_id: '',
});

onMounted(async () => {
  const data = await fetchSettings('seo');
  if (data) {
    Object.assign(form, data);
  }
});

const handleSave = async () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating SEO settings is disabled in Demo Mode.',
    });
    return;
  }
  await updateSettings('seo', form);
};
</script>

<template>
  <div>
    <div class="category-header">
      <div class="icon-box bg-emerald-50 text-emerald-600">
        <LucideIcon name="Search" />
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800">SEO & Analytics</h3>
        <p class="text-sm text-gray-500">Optimize your site for search engines and track traffic.</p>
      </div>
    </div>

    <a-form layout="vertical" class="mt-8">
      <div class="space-y-6">
        <a-form-item label="Meta Title">
          <a-input v-model:value="form.meta_title" size="large" placeholder="E.g. Shuttle Bus - Best Transport Service" :disabled="isDemo" />
        </a-form-item>

        <a-form-item label="Meta Keywords">
          <a-input v-model:value="form.meta_keywords" size="large" placeholder="bus, shuttle, transport, city travel" :disabled="isDemo" />
        </a-form-item>

        <a-form-item label="Meta Description">
          <a-textarea v-model:value="form.meta_description" :rows="4" placeholder="Brief description of your site for search results..." :disabled="isDemo" />
        </a-form-item>

        <div class="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 mt-8">
          <h4 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <LucideIcon name="BarChart" :size="18" /> Analytics Integration
          </h4>
          <a-form-item label="Google Analytics ID (G-XXXXXXX)" class="mb-0">
            <a-input v-model:value="form.google_analytics_id" size="large" placeholder="G-XXXXXXXXXX" :disabled="isDemo" />
          </a-form-item>
        </div>
      </div>

      <div class="flex flex-col items-end mt-12">
        <a-alert
          v-if="isDemo"
          message="Demo Mode Active"
          description="SEO and Analytics configurations are locked in this demonstration."
          type="warning"
          show-icon
          class="mb-6 w-full md:w-auto"
        />
        <a-button v-if="!isDemo" type="primary" size="large" class="submit-btn" :loading="loading" @click="handleSave">
          Update SEO Settings
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

:deep(.ant-input), :deep(.ant-textarea) {
  @apply rounded-xl border-gray-200 transition-all duration-200 bg-gray-50/50;
  border-radius: 0.75rem !important;
  background-color: rgb(249 250 251 / 0.5) !important;
}

:deep(.ant-input:hover), :deep(.ant-input:focus), :deep(.ant-textarea:hover), :deep(.ant-textarea:focus) {
  @apply border-blue-400 ring-4 ring-blue-50 bg-white;
  background-color: #ffffff !important;
}

:deep(.ant-form-item-label > label) {
  @apply text-sm font-bold text-gray-600 mb-1;
}
</style>
