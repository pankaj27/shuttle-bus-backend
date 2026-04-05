<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from '@/services/api';
import LucideIcon from '@/components/LucideIcon.vue';

const route = useRoute();
const content = ref('');
const loading = ref(true);
const error = ref(null);
const appName = import.meta.env.VITE_APP_NAME || 'Jaldiride';

const type = computed(() => {
  const path = route.path;
  if (path.includes('terms')) return 'terms';
  if (path.includes('privacy')) return 'privacypolicy';
  if (path.includes('delete-account')) return 'deleteaccount';
  return '';
});

const title = computed(() => {
  if (type.value === 'terms') return 'Terms & Conditions';
  if (type.value === 'privacypolicy') return 'Privacy Policy';
  if (type.value === 'deleteaccount') return 'Delete Account Instructions';
  return 'Document';
});

const icon = computed(() => {
  if (type.value === 'terms') return 'FileText';
  if (type.value === 'privacypolicy') return 'Lock';
  if (type.value === 'deleteaccount') return 'Trash2';
  return 'File';
});

onMounted(async () => {
  if (!type.value) {
    error.value = 'Invalid document type';
    loading.value = false;
    return;
  }

  try {
    const response = await axios.get(`/settings/publicData`);
    if (response && (response.code === 200 || response.status === 200)) {
        // Handle different response structures
        const data = response.data?.data || response.data || response;
        content.value = data[type.value];
    } else {
      error.value = 'Failed to load document content';
    }
  } catch (err) {
    error.value = 'An error occurred while fetching the document';
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <div class="bg-white shadow-xl rounded-3xl overflow-hidden border border-gray-100">
        <!-- Header -->
        <div class="bg-primary px-8 py-10 text-white relative overflow-hidden text-center">
            <div class="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div class="relative z-10 flex flex-col items-center gap-4">
                <div class="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                    <LucideIcon :name="icon" :size="32" />
                </div>
                <div>
                    <h1 class="text-3xl font-extrabold tracking-tight">{{ title }}</h1>

                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="px-8 py-12">
          <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
            <a-spin size="large" />
            <p class="text-gray-500 animate-pulse">Loading document content...</p>
          </div>

          <div v-else-if="error" class="text-center py-20">
            <div class="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <LucideIcon name="AlertCircle" :size="40" />
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p class="text-gray-500">{{ error }}</p>
          </div>

          <div v-else class="prose prose-blue max-w-none">
            <div v-if="content" v-html="content" class="document-content"></div>
            <div v-else class="text-center py-20 text-gray-400 italic">
                No content available for this document.
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-8 py-6 border-t border-gray-100 flex flex-col sm:flex-row justify-center items-center gap-4">
            <span class="text-sm text-gray-500 font-medium">&copy; {{ new Date().getFullYear() }} {{ appName }}. All rights reserved.</span>
      
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
.document-content :deep(h1) { @apply text-2xl font-bold mb-4 mt-8 text-gray-900; }
.document-content :deep(h2) { @apply text-xl font-bold mb-3 mt-6 text-gray-800; }
.document-content :deep(h3) { @apply text-lg font-bold mb-2 mt-4 text-gray-700; }
.document-content :deep(p) { @apply mb-4 text-gray-600 leading-relaxed; }
.document-content :deep(ul), .document-content :deep(ol) { @apply mb-4 ml-6; }
.document-content :deep(li) { @apply mb-2 text-gray-600; }
.document-content :deep(strong) { @apply font-bold text-gray-900; }
</style>
