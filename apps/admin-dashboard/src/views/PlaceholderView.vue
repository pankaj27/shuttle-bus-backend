<template>
  <div class="p-6 text-center">
    <h1 class="text-2xl font-bold mb-4">{{ title }}</h1>
    <p class="text-gray-500">This module is currently under development.</p>
    <div class="mt-8 flex justify-center">
      <div class="p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <LucideIcon :name="icon" :size="48" class="text-gray-300 mx-auto mb-4" />
        <p class="text-sm">Placeholder for {{ title }} Content</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const title = computed(() => route.meta.title || 'Under Construction');
const icon = computed(() => route.meta.icon || 'Construction');
</script>
