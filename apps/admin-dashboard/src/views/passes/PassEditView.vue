<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import PassForm from '@/components/passes/PassForm.vue'
import { usePass } from '@/composables/usePass'

const route = useRoute()
const router = useRouter()
const { getPassById, updatePass } = usePass()

const loading = ref(false)
const initialData = ref(null)
const passId = route.params.id

onMounted(async () => {
  try {
    const response = await getPassById(passId)
    // Adjust depending on actual API structure. Assuming response.data is the item.
    initialData.value = response.data || response
  } catch (error) {
    message.error('Failed to load pass details')
    router.push({ name: 'passs' })
  }
})

const handleSubmit = async (formData) => {
  loading.value = true
  try {
    await updatePass(passId, formData)
    message.success('Pass updated successfully')
    router.push({ name: 'pass-list' })
  } catch (error) {
    message.error('Failed to update pass')
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Edit Pass</h1>
      <p class="text-gray-500">Update pass details and conditions.</p>
    </div>
    <div v-if="initialData">
      <PassForm
        :initial-data="initialData"
        :is-edit="true"
        :loading="loading"
        @submit="handleSubmit"
      />
    </div>
    <div v-else class="flex justify-center items-center h-64">
      <a-spin size="large" />
    </div>
  </div>
</template>
