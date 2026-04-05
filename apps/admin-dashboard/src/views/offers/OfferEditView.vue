<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import OfferForm from '@/components/offers/OfferForm.vue'
import { useOffers } from '@/composables/useOffers'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()
const { getOfferById, updateOffer } = useOffers()

const loading = ref(false)
const initialData = ref(null)
const offerId = route.params.id

const authStore = useAuthStore()
const isDemo = computed(() => authStore.isDemo)

onMounted(async () => {
  try {
    const response = await getOfferById(offerId)
    // Adjust depending on actual API structure. Assuming response.data is the item.
    initialData.value = response.data || response
  } catch (error) {
    message.error('Failed to load offer details')
    router.push({ name: 'offers' })
  }
})

const handleSubmit = async (formData) => {
  if (isDemo.value) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating offer details is disabled in Demo Mode.',
    });
    return;
  }
  loading.value = true
  try {
    await updateOffer(offerId, formData)
    message.success('Offer updated successfully')
    router.push({ name: 'offers' })
  } catch (error) {
    message.error('Failed to update offer')
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Edit Offer</h1>
      <p class="text-gray-500">Update offer details and conditions.</p>
    </div>
    <div v-if="initialData">
      <a-alert
        v-if="isDemo"
        message="Demo Mode Active"
        description="Offer details can be viewed but modifications are disabled."
        type="warning"
        show-icon
        class="mb-6 rounded-2xl shadow-sm ring-1 ring-amber-100"
      />
      <OfferForm
        :initial-data="initialData"
        :is-edit="true"
        :loading="loading"
        :disabled="isDemo"
        @submit="handleSubmit"
      />
    </div>
    <div v-else class="flex justify-center items-center h-64">
      <a-spin size="large" />
    </div>
  </div>
</template>
