<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute as useVueRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import LucideIcon from '@/components/LucideIcon.vue'
import RouteForm from '@/components/routes/RouteForm.vue'
import { routeService } from '@/services/route.service'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useVueRoute()
const themeStore = useThemeStore()
const authStore = useAuthStore()
const formRef = ref(null)
const loading = ref(false)

const isDemo = computed(() => authStore.isDemo)
const fetching = ref(true)
const routeData = ref(null)

onMounted(async () => {
  await fetchRouteDetails()
})

const fetchRouteDetails = async () => {
  fetching.value = true
  try {
    const response = await routeService.getById(route.params.id)
    const data = response.data || response // Adjust based on API structure

    // Transform API structure to form state
    let stops = []
    try {
      const stopsResponse = await routeService.getStops(route.params.id)
      const rawStops = stopsResponse.data.stops || stopsResponse || []
      stops = rawStops.map((s) => ({
        stopId: s.stopId || s._id || s.id,
        order: s.order,
        distance: s.distance || 0,
        price_per_km_pickup: s.price_per_km_pickup || 0,
        price_per_km_drop: s.price_per_km_drop || 0,
        minimum_fare_pickup: s.minimum_fare_pickup || 0,
        minimum_fare_drop: s.minimum_fare_drop || 0,
      }))
    } catch (e) {
      console.warn('Could not fetch specific stops, checking main object')
      const rawStops = data.stops || []
      stops = rawStops.map((s) => ({
        stopId: s.stopId || s._id || s.id,
        order: s.order,
        distance: s.distance || 0,
        price_per_km_pickup: s.price_per_km_pickup || 0,
        price_per_km_drop: s.price_per_km_drop || 0,
        minimum_fare_pickup: s.minimum_fare_pickup || 0,
        minimum_fare_drop: s.minimum_fare_drop || 0,
      }))
    }

    routeData.value = {
      title: data.title,
      status: data.status,
      stops: stops,
    }
  } catch (error) {
    console.error('Failed to fetch route details:', error)
    message.error('Failed to load route details')
    router.push({ name: 'route-list' })
  } finally {
    fetching.value = false
  }
}

const handleSubmit = async (values) => {
  if (isDemo.value) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating route details is disabled in Demo Mode.',
    });
    return;
  }
  loading.value = true
  try {
    await routeService.update(route.params.id, values)
    message.success('Route updated successfully')
    router.push({ name: 'route-list' })
  } catch (error) {
    console.error('Failed to update route:', error)
    message.error(error.response?.data?.message || 'Failed to update route')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'route-list' })
}

const submitForm = () => {
  formRef.value?.submit()
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-12">
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
          <LucideIcon name="Map" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Edit Route
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Update path details and sequential stops
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
          :loading="loading"
          :disabled="isDemo"
          @click="submitForm"
        >
          Update Route
        </a-button>
      </div>
    </div>

    <!-- Demo Mode Alert -->
    <a-alert
      v-if="isDemo"
      message="Demo Mode Active"
      description="Route details can be viewed but modifications are disabled."
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
      <RouteForm
        v-if="routeData"
        ref="formRef"
        :initialValues="routeData"
        :loading="loading"
        :isEdit="true"
        :disabled="isDemo"
        @submit="handleSubmit"
        @cancel="handleCancel"
        :hide-actions="true"
      />
    </div>
  </div>
</template>
