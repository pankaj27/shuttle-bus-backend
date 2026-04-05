<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import LucideIcon from '@/components/LucideIcon.vue'
import CustomerForm from '@/components/customers/CustomerForm.vue'
import { customerService } from '@/services/customer.service'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const authStore = useAuthStore()
const fetching = ref(true)
const submitting = ref(false)

const isDemo = computed(() => authStore.isDemo)
const initialData = ref(null)
const formRef = ref(null)

onMounted(async () => {
  const id = route.params.id
  if (!id) {
    message.error('No customer ID provided')
    router.push({ name: 'customer-lists' })
    return
  }

  try {
    const response = await customerService.getById(id)
    const data = response.data || response
    if (data) {
      initialData.value = {
        ...data,
        fullname: `${data.firstname || ''} ${data.lastname || ''}`.trim(),
      }
    } else {
      message.error('Customer not found')
    }
  } catch (error) {
    console.error('Fetch Error:', error)
    message.error('Failed to load customer details')
  } finally {
    fetching.value = false
  }
})

const handleSubmit = async (formData) => {
  if (isDemo.value) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating customer details is disabled in Demo Mode.',
    });
    return;
  }
  submitting.value = true
  try {
    const apiData = {
      ...formData,
      status: formData.status === 'Active',
    }

    const id = route.params.id
    await customerService.update(id, apiData)
    message.success('Customer updated successfully')
    router.push({ name: 'customer-lists' })
  } catch (error) {
    console.error('Update Error:', error)
    message.error(error.response?.data?.message || 'Failed to update customer')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'customer-lists' })
}

const submitForm = () => {
  formRef.value?.submit()
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div
      class="sticky top-0 z-40 flex justify-between items-center p-4 border shadow-md transition-all duration-300 backdrop-blur-md"
      :class="themeStore.isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-100'"
      :style="{ borderRadius: 'var(--radius-premium)' }"
    >
      <div class="flex items-center gap-4">
        <div
          class="p-3 rounded-2xl transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'"
        >
          <LucideIcon name="User" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Edit Customer
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Update account details for {{ initialData?.fullname || 'customer' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <a-button size="large" @click="handleCancel" class="rounded-xl border-gray-200">
          Cancel
        </a-button>
        <a-button
          type="primary"
          size="large"
          class="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl px-8"
          :loading="submitting"
          :disabled="isDemo"
          @click="submitForm"
        >
          Update Customer
        </a-button>
      </div>
    </div>

    <!-- Demo Mode Alert -->
    <a-alert
      v-if="isDemo"
      message="Demo Mode Active"
      description="Customer details can be viewed but modifications are disabled."
      type="warning"
      show-icon
      class="rounded-xl mb-6 shadow-sm ring-1 ring-amber-100"
    />

    <!-- Form Section -->
    <div
      class="p-8 border shadow-sm transition-colors duration-300 relative"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
      :style="{ borderRadius: 'var(--radius-premium)' }"
    >
      <div
        v-if="fetching"
        class="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-3xl"
      >
        <a-spin size="large" />
      </div>

      <CustomerForm
        v-if="initialData"
        ref="formRef"
        :initialData="initialData"
        :isEdit="true"
        :loading="submitting"
        :disabled="isDemo"
        @submit="handleSubmit"
        hide-actions
      />

      <div
        v-else-if="!fetching"
        class="flex flex-col items-center justify-center h-64 border border-dashed border-gray-200 rounded-2xl"
      >
        <LucideIcon name="UserX" :size="48" class="text-gray-300 mb-4" />
        <p class="text-gray-500">Customer not found</p>
        <a-button type="primary" @click="handleCancel" class="mt-2 rounded-xl">
          Back to List
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
