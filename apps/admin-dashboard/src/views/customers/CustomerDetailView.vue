
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { customerService } from '@/services/customer.service'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const fetching = ref(true)
const customer = ref(null)

onMounted(async () => {
  const id = route.params.id
  if (!id) {
    message.error('No customer ID provided')
    router.push({ name: 'customer-lists' })
    return
  }

  try {
    const response = await customerService.getById(id)
    customer.value = response.data || response
  } catch (error) {
    console.error('Fetch Error:', error)
    message.error('Failed to load customer profile')
  } finally {
    fetching.value = false
  }
})

const handleEdit = () => {
  router.push({ name: 'customer-edit', params: { id: route.params.id } })
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatNumber = (num) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div
      class="flex justify-between items-center p-6 border shadow-sm transition-colors duration-300"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
      :style="{ borderRadius: 'var(--radius-premium)' }"
    >
      <div class="flex items-center gap-4">
        <div
          class="p-3 rounded-2xl transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'"
        >
          <LucideIcon name="Contact" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Customer Profile
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Detailed information and activity for {{ customer?.firstname || 'customer' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <a-button size="large" @click="$router.back()" class="rounded-xl border-gray-200">
           Back
        </a-button>
        <a-button
          type="primary"
          size="large"
          class="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl px-8 flex items-center gap-2"
          @click="handleEdit"
        >
          <LucideIcon name="UserPen" :size="18" />
          Edit Profile
        </a-button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="fetching" class="flex flex-col items-center justify-center h-64 gap-4">
      <a-spin size="large" />
      <span class="text-gray-500 text-sm">Loading profile...</span>
    </div>

    <!-- Content -->
    <div v-else-if="customer" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Basic Info Card -->
      <div class="lg:col-span-1 space-y-6">
        <a-card 
          :bordered="false" 
          class="shadow-sm overflow-hidden transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
          :style="{ borderRadius: 'var(--radius-premium)' }"
        >
          <div class="flex flex-col items-center pt-8 pb-6 border-b transition-colors duration-300" :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-50'">
            <div class="relative mb-4">
              <a-avatar :size="120" :src="customer.picture" class="border-4 shadow-md transition-colors duration-300" :class="themeStore.isDark ? 'border-gray-700' : 'border-blue-50'">
                <template #icon><LucideIcon name="User" :size="48" /></template>
              </a-avatar>
              <div
                class="absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-white shadow-sm"
                :class="customer.status ? 'bg-green-500' : 'bg-red-500'"
              ></div>
            </div>
            <h3 class="text-xl font-bold m-0 transition-colors duration-300" :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-900'">{{ customer.firstname }} {{ customer.lastname }}</h3>
            <p class="text-sm transition-colors duration-300" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">{{ customer.email }}</p>
            <a-tag :color="customer.status ? 'success' : 'error'" class="mt-2 rounded-lg px-3 py-1">
              {{ customer.status ? 'Active' : 'Inactive' }}
            </a-tag>
          </div>

          <div class="p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 text-gray-500">
                <LucideIcon name="Phone" :size="18" />
                <span class="text-xs font-semibold uppercase tracking-wider">Phone</span>
              </div>
              <span class="font-medium transition-colors duration-300" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-800'">{{ customer.country_code }} {{ customer.phone }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 text-gray-500">
                <LucideIcon name="UserCircle" :size="18" />
                <span class="text-xs font-semibold uppercase tracking-wider">Gender</span>
              </div>
              <span class="font-medium transition-colors duration-300" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-800'">{{ customer.gender || 'Not specified' }}</span>
            </div>
             <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 text-gray-500">
                <LucideIcon name="Calendar" :size="18" />
                <span class="text-xs font-semibold uppercase tracking-wider">Joined</span>
              </div>
              <span class="font-medium transition-colors duration-300" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-800'">{{ formatDate(customer.createdAt) }}</span>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 text-gray-500">
                <LucideIcon name="Share2" :size="18" />
                <span class="text-xs font-semibold uppercase tracking-wider">Referral Code</span>
              </div>
              <span class="font-medium transition-colors duration-300" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-800'">{{ customer.refercode }}</span>
            </div>
          </div>
        </a-card>

        <!-- Wallet Card -->
        <a-card :bordered="false" class="shadow-sm mt-4 bg-blue-600 text-white overflow-hidden relative" :style="{ borderRadius: 'var(--radius-premium)' }">
          <div class="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative">
            <div class="flex items-center gap-3 mb-4 text-blue-100">
              <LucideIcon name="Wallet" :size="20" />
              <span class="text-sm font-medium uppercase tracking-wider">Wallet Balance</span>
            </div>
            <div class="text-3xl font-bold mb-6">
              {{ formatNumber(customer.wallet_balance || 0) }}
            </div>
            <div class="flex gap-3">
              <a-button 
                class="flex-1 bg-white text-blue-600 border-none hover:bg-blue-50 rounded-xl h-11 font-bold shadow-sm"
                @click="$router.push({ name: 'transaction-histories', query: { id: customer.id } })"
              >
                View History
              </a-button>
              <a-button 
                class="flex-1 bg-white text-blue-600 border-none hover:bg-blue-50 rounded-xl h-11 font-bold shadow-sm"
                @click="$router.push({ name: 'wallet-recharge', query: { user_id: customer.id } })"
              >
                Add Credits
              </a-button>
            </div>
          </div>
        </a-card>
      </div>

      <!-- Right Column: Stats & Recent Activity -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a-card :bordered="false" class="shadow-sm rounded-2xl p-4 text-center transition-colors duration-300" :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'">
            <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Trips</div>
            <div class="text-2xl font-bold transition-colors duration-300" :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'">{{ customer.total_bookings }}</div>
          </a-card>
          <a-card :bordered="false" class="shadow-sm rounded-2xl p-4 text-center transition-colors duration-300" :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'">
            <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Trip Spent</div>
            <div class="text-2xl font-bold transition-colors duration-300" :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"> {{ customer.total_spent_trip }}</div>
          </a-card>
              <a-card :bordered="false" class="shadow-sm rounded-2xl p-4 text-center transition-colors duration-300" :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'">
            <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Pass Spent</div>
            <div class="text-2xl font-bold transition-colors duration-300" :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"> {{ customer.total_spent_pass }}</div>
          </a-card>
          <a-card :bordered="false" class="shadow-sm rounded-2xl p-4 text-center transition-colors duration-300" :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'">
            <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Refund</div>
            <div class="text-2xl font-bold text-red-500">{{ customer.total_refund }}</div>
          </a-card>
        </div>

        <!-- Activity -->
        <a-card 
          title="Recent Bookings" 
          :bordered="false" 
          class="shadow-sm transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-100'"
          :style="{ borderRadius: 'var(--radius-premium)' }"
        >
          <template #extra>
             <a-button type="link" class="text-blue-500" @click="$router.push({ name: 'booking-histories', query: { id: customer.id } })">View All</a-button>
          </template>
          
          <div v-if="!customer.recent_bookings?.length" class="text-center py-8 text-gray-400">
            No recent bookings found
          </div>
          
          <a-list v-else item-layout="horizontal" :data-source="customer.recent_bookings">
            <template #renderItem="{ item }">
              <a-list-item class="border-b transition-colors duration-300 px-4" :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-50'">
                <a-list-item-meta>
                  <template #title>
                    <div class="flex items-center justify-between">
                      <span class="font-bold transition-colors duration-300" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-800'">
                        PNR #{{ item.pnr_no }}
                      </span>
                      <a-tag :color="item.travel_status === 'COMPLETED' ? 'success' : 'processing'" class="rounded-lg m-0">
                        {{ item.travel_status }}
                      </a-tag>
                    </div>
                  </template>
                  <template #description>
                    <div class="space-y-1">
                      <div class="transition-colors duration-300" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
                        {{ item.route_name }}
                      </div>
                      <div class="text-[10px] text-gray-400 flex items-center gap-2">
                         <span>{{ item.start_date }}</span>
                         <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
                         <span>{{ item.start_time }}</span>
                      </div>
                    </div>
                  </template>
                  <template #avatar>
                     <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center transition-colors duration-300">
                        <LucideIcon name="Bus" :size="18" class="text-blue-500" />
                     </div>
                  </template>
                </a-list-item-meta>
                <div class="text-right ml-4">
                  <div class="font-bold transition-colors duration-300" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-800'">
                    {{ formatNumber(item.final_total_fare || 0) }}
                  </div>
                  <div class="text-[10px] text-gray-400">{{ item.payment_status }}</div>
                </div>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="text-center py-20 border border-dashed transition-colors duration-300" :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'" :style="{ borderRadius: 'var(--radius-premium)' }">
       <LucideIcon name="Frown" :size="48" class="text-gray-300 mx-auto mb-4" />
       <p class="text-gray-500">Could not load customer profile</p>
       <a-button type="primary" class="rounded-xl px-8" @click="$router.push({ name: 'customer-lists' })">Return to List</a-button>
    </div>
  </div>
</template>

<style scoped>
:deep(.ant-card-head) {
  border-bottom: 1px solid v-bind('themeStore.isDark ? "#374151" : "#f9fafb"');
}
:deep(.ant-card-head-title) {
  font-weight: 700;
  color: v-bind('themeStore.isDark ? "#f3f4f6" : "#111827"');
}
</style>
