<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 m-0">Payments</h2>
          <p class="text-gray-500 m-0 text-sm">Manage and track travel payments</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <ExportExcel 
          :data="selectedRows" 
          :columns="exportColumns" 
          filename="payments-list"
          v-if="selectedRowKeys.length > 0"
        />
        <a-button type="primary" class="rounded-xl flex items-center gap-2 h-10 px-4 shadow-sm" @click="refresh">
          <LucideIcon name="RotateCcw" :size="18" />
          <span>Refresh</span>
        </a-button>
      </div>
    </div>

       <!-- Stats Overview -->
    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
         <a-card :bordered="false" class="shadow-sm rounded-2xl">
        <div class="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Earnings</div>
        <div v-if="loading" class="mt-2 text-2xl"><a-skeleton-button active size="small" style="width: 80px" /></div>
        <div v-else class="text-3xl font-black mt-1 text-gray-800">{{ default_currency }}{{ formatNumber(paymentStatusTotals?.totalEarnings,0) || 0 }}</div>
      </a-card>

      <a-card :bordered="false" class="shadow-sm rounded-2xl">
        <div class="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Completed</div>
        <div v-if="loading" class="mt-2 text-2xl"><a-skeleton-button active size="small" style="width: 80px" /></div>
        <div v-else class="text-3xl font-black mt-1 text-green-500">{{ default_currency }}{{ formatNumber(paymentStatusTotals?.totalCompleted,0) || 0 }}</div>
      </a-card>
      <a-card :bordered="false" class="shadow-sm rounded-2xl">
        <div class="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Cancelled</div>
        <div v-if="loading" class="mt-2 text-2xl"><a-skeleton-button active size="small" style="width: 80px" /></div>
        <div v-else class="text-3xl font-black mt-1 text-red-500">{{ default_currency }}{{ formatNumber(paymentStatusTotals?.totalCancelled,0) || 0 }}</div>
      </a-card>
      <a-card :bordered="false" class="shadow-sm rounded-2xl">
        <div class="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Refunds</div>
        <div v-if="loading" class="mt-2 text-2xl"><a-skeleton-button active size="small" style="width: 80px" /></div>
        <div v-else class="text-3xl font-black mt-1 text-red-500">{{ default_currency }}{{ formatNumber(paymentStatusTotals?.totalRefunded,0) || 0 }}</div>
      </a-card>
    </div>

    

    <!-- Status Filter -->
    <div class="flex justify-center mb-6">
      <a-segmented 
        v-model:value="activeTab" 
        :options="statusOptions"
        size="large"
        class="shadow-sm"
      />
    </div>

    <!-- Filters -->
    <a-card :bordered="false" class="shadow-sm rounded-3xl mb-0 overflow-hidden">
      <div class="flex flex-wrap gap-4 items-center">
        <a-input
          v-model:value="searchText"
          placeholder="Search by PNR, customer name or phone..."
          class="w-full md:w-80 rounded-xl"
          @input="handleSearch"
        >
          <template #prefix><LucideIcon name="Search" :size="16" class="text-gray-400" /></template>
        </a-input>

        <DateRangeFilter v-model:value="dateRange" class="w-full md:w-80" @change="handleSearch" />

        <a-button @click="resetFilters" class="rounded-xl flex items-center justify-center w-10 h-10">
          <LucideIcon name="X" :size="18" />
        </a-button>
      </div>
    </a-card>

    <!-- Table -->
    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <a-table
        :columns="columns"
        :data-source="payments"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        row-key="id"
        @change="handleTableChange"
        class="custom-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'pnr_no'">
            <span class="font-mono font-bold text-blue-600">{{ record.pnr_no }}</span>
          </template>

          <template v-if="column.key === 'customer'">
            <div class="flex flex-col">
              <span class="font-semibold text-gray-800 text-sm">{{ record.customer_name }}</span>
              <span class="text-[14px] text-gray-400 font-medium">{{ record.customer_phone }}</span>
            </div>
          </template>

      


          <template v-if="column.key === 'amount'">
            <span class="font-bold text-gray-900">{{ record.amount }}</span>
          </template>

    
          <template v-if="column.key === 'orderId'">
            <span class="font-bold text-gray-900 text-sm">{{ record.orderId }}</span>
          </template>

          <template v-if="column.key === 'action'">
            <a-dropdown :trigger="['click']">
              <a-button type="text" class="flex items-center justify-center hover:bg-gray-100 rounded-lg h-8 w-8 p-0">
                <LucideIcon name="MoreVertical" :size="20" class="text-gray-500" />
              </a-button>
              <template #overlay>
                <a-menu class="rounded-xl shadow-lg border border-gray-100 min-w-[140px] p-1">
                  <a-menu-item key="view" class="rounded-lg hover:bg-blue-50 group"     @click="viewDetails(record)">
                    <div class="flex items-center gap-2 py-1">
                      <LucideIcon name="Eye" :size="16" class="text-blue-500 group-hover:scale-110 transition-transform" />
                      <span class="text-gray-700 font-medium text-sm">View Details</span>
                    </div>
                  </a-menu-item>
                  <a-menu-item v-if="record.travel_status === 'ONBOARDED'" key="track" class="rounded-lg hover:bg-indigo-50 group">
                    <div class="flex items-center gap-2 py-1">
                      <LucideIcon name="MapPin" :size="16" class="text-indigo-500 group-hover:scale-110 transition-transform" />
                      <span class="text-gray-700 font-medium text-sm">Track Bus</span>
                    </div>
                  </a-menu-item>
                  <!-- <a-menu-divider v-if="record.travel_status === 'SCHEDULED'" />
                  <a-menu-item key="cancel" class="rounded-lg hover:bg-red-50 group" v-if="record.travel_status === 'SCHEDULED'">
                    <div class="flex items-center gap-2 py-1 text-red-600">
                      <LucideIcon name="CircleX" :size="16" class="group-hover:scale-110 transition-transform" />
                      <span class="font-medium text-sm">Cancel Booking</span>
                    </div>
                  
                  </a-menu-item> -->
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </template>
      </a-table>



    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { usePayment } from '@/composables/usePayment'
import LucideIcon from '@/components/LucideIcon.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import ExportExcel from '@/components/ExportExcel.vue'
import { formatDate, formatNumber } from '@/utils/date'
import { useAuthStore } from '@/stores/auth'
  

const drawerVisible = ref(false)
const selectedBooking = ref(null)

const { generalSettings} = useAuthStore()
const default_currency = ref(generalSettings.default_currency)

const {
  loading,
  searchText,
  activeTab,
  payments,
  pagination,
  columns,
  refresh,
  handleTableChange,
  handleTabChange,
  handleSearch,
  dateRange,
  exportColumns,
  paymentStatusTotals,
} = usePayment()

const selectedRowKeys = ref([])
const selectedRows = ref([])

const rowSelection = {
  onChange: (keys, rows) => {
    selectedRowKeys.value = keys
    selectedRows.value = rows
  }
}

watch(payments, () => {
  selectedRowKeys.value = []
  selectedRows.value = []
})

const statusOptions = [
  { label: 'All Payments', value: 'all' },
    { label: 'Processing', value: 'Processing' },
    { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
  { label: 'Refunded', value: 'Refunded' },
]

// Watch for activeTab changes to trigger search
watch(activeTab, () => {
  handleTabChange()
})

const viewDetails = (record) => {
  selectedBooking.value = record
  drawerVisible.value = true
}

const resetFilters = () => {
  searchText.value = ''
  dateRange.value = []
  activeTab.value = 'all'
  handleTabChange()
}

const getTravelStatusColor = (status) => {
  const s = status?.toString().toLowerCase()
  if (s === 'completed' || s === 'boarded') return 'success'
  if (s === 'confirmed') return 'processing'
  if (s === 'pending') return 'warning'
  if (s === 'cancelled') return 'error'
  return 'default'
}

const getPaymentStatusColor = (status) => {
  const s = status?.toString().toLowerCase()
  if (s === 'paid' || s === 'success' || s === 'completed') return '#10b981'
  if (s === 'pending') return '#f59e0b'
  if (s === 'failed' || s === 'refunded') return '#ef4444'
  return '#6b7280'
}

const getPaymentStatusBg = (status) => {
  const s = status?.toString().toLowerCase()
  if (s === 'paid' || s === 'success' || s === 'completed') return 'rgba(16, 185, 129, 0.1)'
  if (s === 'pending') return 'rgba(245, 158, 11, 0.1)'
  if (s === 'failed' || s === 'refunded') return 'rgba(239, 68, 68, 0.1)'
  return 'rgba(107, 114, 128, 0.1)'
}
</script>

<style scoped>
@reference "tailwindcss";

:deep(.custom-table .ant-table-thead > tr > th) {
  @apply bg-gray-50/50 text-gray-500 font-bold text-xs uppercase tracking-wider;
}

:deep(.ant-input),
:deep(.ant-select-selector) {
  @apply rounded-xl border-gray-200!;
}
</style>
