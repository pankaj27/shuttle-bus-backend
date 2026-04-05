<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-4">
        <a-button
          @click="$router.push({ name: 'customer-lists' })"
          type="text"
          class="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <template #icon><LucideIcon name="ArrowLeft" :size="20" /></template>
        </a-button>
        <div>
          <h2 class="text-2xl font-bold text-gray-900 m-0">Booking Histories</h2>
          <p class="text-gray-500 m-0 text-sm">
            Detailed log of all financial activities and bookings
          </p>
        </div>
      </div>
      <ExportExcel
        :data="selectedRows"
        :columns="exportColumns"
        filename="booking-history"
        v-if="selectedRowKeys.length > 0"
      />
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <a-card :bordered="false" class="shadow-sm rounded-2xl">
        <div class="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Bookings</div>
        <div v-if="loading" class="mt-2 text-2xl"><a-skeleton-button active size="small" style="width: 80px" /></div>
        <div v-else class="text-3xl font-black mt-1 text-gray-800">{{ pagination.total  }}</div>
      </a-card>
      <a-card :bordered="false" class="shadow-sm rounded-2xl">
        <div class="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Scheduled</div>
        <div v-if="loading" class="mt-2 text-2xl"><a-skeleton-button active size="small" style="width: 80px" /></div>
        <div v-else class="text-3xl font-black mt-1 text-green-500">{{totalScheduled}}</div>
      </a-card>
      <a-card :bordered="false" class="shadow-sm rounded-2xl">
        <div class="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Cancelled</div>
        <div v-if="loading" class="mt-2 text-2xl"><a-skeleton-button active size="small" style="width: 80px" /></div>
        <div v-else class="text-3xl font-black mt-1 text-red-500">{{totalCancelled}}</div>
      </a-card>
      <a-card :bordered="false" class="shadow-sm rounded-2xl">
        <div class="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Refunds</div>
        <div v-if="loading" class="mt-2 text-2xl"><a-skeleton-button active size="small" style="width: 80px" /></div>
        <div v-else class="text-3xl font-black mt-1 text-red-500">{{totalRefundAmount}}</div>
      </a-card>
    </div>

    <!-- Filters -->
    <a-card :bordered="false" class="shadow-sm rounded-3xl mb-6 overflow-hidden">
      <div class="flex flex-wrap gap-4 items-center">
        <a-input
          v-model:value="filters.search"
          placeholder="Transaction ID, Ref..."
          class="w-full md:w-80 rounded-xl"
          @input="handleSearch"
        >
          <template #prefix><LucideIcon name="Search" :size="16" class="text-gray-400" /></template>
        </a-input>

        <a-select
          v-model:value="filters.method"
          placeholder="Method"
          class="w-full md:w-40"
          allow-clear
          @change="handleSearch"
        >
          <a-select-option value="wallet">Wallet</a-select-option>
          <a-select-option value="stripe">Stripe</a-select-option>
          <a-select-option value="paypal">PayPal</a-select-option>
          <a-select-option value="cash">Cash</a-select-option>
        </a-select>

        <DateRangeFilter
          v-model:value="filters.dateRange"
          class="w-full md:w-80 mr-2"
          @change="handleSearch"
        />

        <a-button
          @click="resetFilters"
          class="flex items-center justify-center w-10 h-10 rounded-xl"
        >
          <LucideIcon name="RotateCcw" :size="18" />
        </a-button>
      </div>
    </a-card>

    <!-- Table -->
    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <a-table
        :columns="columns"
        :data-source="transactions"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        row-key="ids"
        @change="handleTableChange"
        class="custom-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'pnr_no'">
            <span class="font-mono text-xs font-bold text-blue-600">#{{ record.pnr_no }}</span>
          </template>

          <template v-if="column.key === 'route_name'">
            <div class="flex flex-col">
              <span class="text-gray-900 font-semibold text-sm">{{
                record.route_name || 'N/A'
              }}</span>
              <div
                v-if="record.location"
                class="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-0.5"
              >
                <span class="truncate max-w-[100px]">{{
                  record.location.pickup_location || 'N/A'
                }}</span>
                <LucideIcon name="ArrowRight" :size="10" />
                <span class="truncate max-w-[100px]">{{
                  record.location.drop_location || 'N/A'
                }}</span>
              </div>
            </div>
          </template>

          <template v-if="column.key === 'start_date'">
            <div class="flex flex-col">
              <span class="text-gray-900 font-semibold text-sm">{{
                formatDate(record.booking_date)
              }}</span>

           
              <div class="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                <span>{{ record.start_time }}</span>
                <LucideIcon name="Minus" :size="8" />
                <span>{{ record.drop_time }}</span>
              </div>
            </div>
          </template>

          <template v-if="column.key === 'amount'">
            <span class="text-gray-900 font-black"> {{ record.amount }}</span>
          </template>

          <template v-if="column.key === 'is_pass'">
            <a-tag
              :color="getStatusColor(record.is_pass)"
              class="rounded-lg px-3 uppercase text-[10px] font-bold"
            >
              {{ record.is_pass }}
            </a-tag>
          </template>

          <template v-if="column.key === 'method'">
            <div class="flex items-center gap-2">
              <LucideIcon :name="getMethodIcon(record.method)" :size="14" class="text-gray-400" />
              <span class="text-xs font-medium capitalize text-gray-600">{{ record.method }}</span>
            </div>
          </template>

          <template v-if="column.key === 'status'">
            <a-tag
              :color="getStatusColor(record.status)"
              class="rounded-lg px-3 uppercase text-[10px] font-bold"
            >
              {{ record.status }}
            </a-tag>
          </template>

          <template v-if="column.key === 'createdAt'">
            <span class="text-gray-700 font-medium">{{ formatDate(record.createdAt) }}</span>
          </template>

          <template v-if="column.key === 'action'">
            <a-button
              type="text"
              class="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors mx-auto"
              @click="viewDetails(record)"
            >
              <template #icon><LucideIcon name="Eye" :size="16" /></template>
            </a-button>
          </template>
        </template>
      </a-table>
    </div>

    <!-- Booking Detail Drawer -->
    <BookingDetailDrawer
      v-model:visible="drawerVisible"
      :booking="selectedBooking"
      @close="selectedBooking = null"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import LucideIcon from '@/components/LucideIcon.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import BookingDetailDrawer from './components/BookingDetailDrawer.vue'
import ExportExcel from '@/components/ExportExcel.vue'
import { customerService } from '@/services/customer.service'
import { formatDate, formatNumber } from '@/utils/date'

const route = useRoute()
const loading = ref(false)
const transactions = ref([])
const drawerVisible = ref(false)
const selectedBooking = ref(null)
const selectedRowKeys = ref([])
const selectedRows = ref([])
const totalRefundAmount = ref(0)
const totalScheduled = ref(0)
const totalCancelled = ref(0)

const rowSelection = {
  onChange: (keys, rows) => {
    selectedRowKeys.value = keys
    selectedRows.value = rows
  },
}

const exportColumns = [
  { title: 'Customer Name', dataIndex: 'customer_name' },
  { title: 'Customer Phone', dataIndex: 'customer_phone' },
  { title: 'PNR No', dataIndex: 'pnr_no' },
  { title: 'Route Name', dataIndex: 'route_name' },
  { title: 'Pickup Location', dataIndex: 'location.pickup_location' },
  { title: 'Pickup Time', dataIndex: 'start_time' },
  { title: 'Drop Location', dataIndex: 'location.drop_location' },
  { title: 'Drop Time', dataIndex: 'drop_time' },
  { title: 'Seat Nos', dataIndex: 'seat_nos' },
  { title: 'Bus Name', dataIndex: 'bus_name' },
  { title: 'Driver Name', dataIndex: 'driver_name' },
  { title: 'Amount', dataIndex: 'amount' },
  { title: 'Method', dataIndex: 'method' },
  { title: 'Status', dataIndex: 'status' },
  { title: 'Booking Date', dataIndex: 'start_date' },
]

const filters = reactive({
  search: '',
  method: undefined,
  dateRange: [],
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
})

const columns = [
  { title: 'PNR NO', dataIndex: 'pnr_no', key: 'pnr_no' },
  { title: 'Route Name', dataIndex: 'route_name', key: 'route_name' },
  { title: 'Date/Time', dataIndex: 'start_date', key: 'start_date' },
  { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right' },
  { title: 'Payment Method', dataIndex: 'method', key: 'method' },
  { title: 'Is Pass', key: 'is_pass', dataIndex: 'is_pass' },
  { title: 'Status', dataIndex: 'status', key: 'status', align: 'center' },
  { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', align: 'right' },
  { title: 'Action', key: 'action', align: 'center', width: 80 },
]

onMounted(() => {
  fetchTransactions()
})

const viewDetails = (record) => {
  selectedBooking.value = record
  drawerVisible.value = true
}

const fetchTransactions = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      search: filters.search,
      method: filters.method,
      sortBy: 'createdAt',
      sortDesc: 'desc',
      startDate: filters.dateRange?.length ? filters.dateRange[0].format('YYYY-MM-DD') : null,
      endDate: filters.dateRange?.length ? filters.dateRange[1].format('YYYY-MM-DD') : null,
    }
    // Assuming we'll use a general transactions endpoint if it exists, otherwise fall back to user-specific
    // In this case, we'll try to find an endpoint or use user data
    const response = await customerService.getBookingHistory(route.query.id, params) // Mocking behavior
    transactions.value = response.items || response.data?.items || []
    pagination.total = response.totalRecords || response.data?.total || 0
    selectedRowKeys.value = []
    selectedRows.value = []
    totalRefundAmount.value = response.totalRefundAmount || response.data?.totalRefundAmount || 0
    totalScheduled.value = response.totalScheduled || response.data?.totalScheduled || 0
    totalCancelled.value = response.totalCancelled || response.data?.totalCancelled || 0
  } catch (error) {
    message.error('Failed to load transaction history')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchTransactions()
}

const resetFilters = () => {
  filters.search = ''
  filters.method = undefined
  filters.dateRange = []
  handleSearch()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchTransactions()
}

const getStatusColor = (status) => {
  const colors = {
    completed: 'success',
    Yes: 'success',
    pending: 'warning',
    expired: 'error',
    cancelled: 'error',
    refunded: 'default',
  }
  return colors[status?.toLowerCase()] || 'processing'
}

const getMethodIcon = (method) => {
  const icons = {
    wallet: 'Wallet',
    stripe: 'CreditCard',
    paypal: 'DollarSign',
    cash: 'Banknote',
  }
  return icons[method?.toLowerCase()] || 'Activity'
}
</script>

<style scoped>
@reference "tailwindcss";

:deep(.custom-table .ant-table-thead > tr > th) {
  @apply bg-gray-50/50 text-gray-500 font-bold text-xs uppercase tracking-wider;
}

:deep(.ant-input),
:deep(.ant-select-selector) {
  @apply rounded-xl border-gray-200;
}
</style>
