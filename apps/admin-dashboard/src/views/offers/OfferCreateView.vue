<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import OfferForm from '@/components/offers/OfferForm.vue'
import { useOffers } from '@/composables/useOffers'

const router = useRouter()
const { createOffer } = useOffers()
const loading = ref(false)

const handleSubmit = async (formData) => {
  loading.value = true
  try {
    await createOffer(formData)
    message.success('Offer created successfully')
    router.push({ name: 'offers' })
  } catch (error) {
    message.error('Failed to create offer')
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Create New Offer</h1>
      <p class="text-gray-500">Create a new discount or promotional offer.</p>
    </div>
    <OfferForm @submit="handleSubmit" :loading="loading" :is-edit="false" />
  </div>
</template>
