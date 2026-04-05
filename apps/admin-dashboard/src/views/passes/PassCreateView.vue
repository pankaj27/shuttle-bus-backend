<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import PassForm from '@/components/passes/PassForm.vue'
import { usePass } from '@/composables/usePass'

const router = useRouter()
const { createPass } = usePass()
const loading = ref(false)

const handleSubmit = async (formData) => {
  loading.value = true
  try {
    await createPass(formData)
    message.success('Pass created successfully')
    router.push({ name: 'pass-list' })
  } catch (error) {
    message.error('Failed to create pass')
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Create New Pass</h1>
      <p class="text-gray-500">Create a new discount or promotional pass.</p>
    </div>
    <PassForm @submit="handleSubmit" :loading="loading" :is-edit="false" />
  </div>
</template>
