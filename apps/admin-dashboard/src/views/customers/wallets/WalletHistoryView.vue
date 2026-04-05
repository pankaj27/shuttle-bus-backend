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
          <h2 class="text-2xl font-bold text-gray-900 m-0">Transaction Histories</h2>
          <p class="text-gray-500 m-0 text-sm">Review credit and debit records for customers</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <ExportExcel 
          :data="selectedRows" 
          :columns="exportColumns" 
          filename="wallet-history"
          v-if="selectedRowKeys.length > 0"
        />
        <a-button
          type="primary"
          size="large"
          @click="$router.push({ name: 'wallet-recharge', query: { user_id: route.query.id } })"
          class="rounded-xl px-6 bg-blue-600 shadow-lg shadow-blue-100 flex items-center gap-2"
        >
          <LucideIcon name="PlusCircle" :size="18" />
          Add Wallet Balance
        </a-button>
      </div>
    </div>

    <!-- Filters -->
    <a-card :bordered="false" class="shadow-sm rounded-3xl mb-6 overflow-hidden">
      <div class="flex flex-wrap gap-4 items-center">
        <a-input
          v-model:value="filters.search"
          placeholder="Search by note or ref..."
          class="w-full md:w-80 rounded-xl"
          @input="handleSearch"
        >
           <template #prefix><LucideIcon name="Search" :size="16" class="text-gray-400" /></template>
        </a-input>

        <a-select v-model:value="filters.type" placeholder="Trans Type" class="w-full md:w-40" allow-clear @change="handleSearch">
           <a-select-option value="credit">Credit Only</a-select-option>
           <a-select-option value="debit">Debit Only</a-select-option>
        </a-select>

        <DateRangeFilter v-model:value="filters.dateRange" class="w-full md:w-80 mr-2" @change="handleSearch" />

        <a-button @click="resetFilters" class="">
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
        row-key="id"
        @change="handleTableChange"
        class="custom-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="record.type === 'credit' ? 'success' : 'error'" class="rounded-lg px-3 uppercase text-[10px] font-bold">
              {{ record.type }}
            </a-tag>
          </template>

          <template v-if="column.key === 'amount'">
            <span :class="record.type === 'credit' ? 'text-green-600' : 'text-red-600'" class="font-bold">
              {{ record.type === 'credit' ? '+' : '-' }}  {{ record.amount }}
            </span>
          </template>

          <template v-if="column.key === 'user'">
            <div class="flex items-center gap-3">
              <a-avatar :src="record.user?.picture" :size="32">
                 <template #icon><LucideIcon name="User" :size="14" /></template>
              </a-avatar>
              <div class="flex flex-col">
                <span class="font-semibold text-gray-800 text-sm">{{ record.user?.firstname }} {{ record.user?.lastname }}</span>
                <span class="text-[10px] text-gray-400 font-medium">{{ record.user?.phone }}</span>
              </div>
            </div>
          </template>

          <template v-if="column.key === 'createdAt'">
            <div class="flex flex-col">
              <span class="text-gray-700 font-medium">{{ formatDate(record.createdAt) }}</span>
              <span class="text-[10px] text-gray-400 capitalize">{{ record.title }}</span>
            </div>
          </template>

               <template v-if="column.key === 'is_pass'">
            <a-tag :color="getStatusColor(record.is_pass)" class="rounded-lg px-3 uppercase text-[10px] font-bold">
              {{ getStatusText(record.is_pass) }}
            </a-tag>
          </template>


          <template v-if="column.key === 'payment_status'">
            <a-tag :color="getStatusColor(record.payment_status)" class="rounded-lg px-3 uppercase text-[10px] font-bold">
              {{ getStatusText(record.payment_status) }}
            </a-tag>
          </template>

          
          <template v-if="column.key === 'payment_type'">
            <a-tag :color="getStatusColor(record.payment_type)" class="rounded-lg px-3 uppercase text-[10px] font-bold">
              {{ getStatusText(record.payment_type) }}
            </a-tag>
          </template>
          
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import LucideIcon from '@/components/LucideIcon.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import ExportExcel from '@/components/ExportExcel.vue'
import { customerService } from '@/services/customer.service'
import { formatDate, formatNumber } from '@/utils/date' // Assuming formatNumber is added to utility
import { SortDesc } from 'lucide-vue-next'

const route = useRoute()
const loading = ref(false)
const transactions = ref([])

const filters = reactive({
  search: '',
  type: undefined,
  dateRange: []
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true
})

const selectedRowKeys = ref([])
const selectedRows = ref([])

const rowSelection = {
  onChange: (keys, rows) => {
    selectedRowKeys.value = keys
    selectedRows.value = rows
  }
}

const exportColumns = [
  { title: 'Customer Name', dataIndex: 'user.fullname' },
  { title: 'Phone', dataIndex: 'user.phone' },
  { title: 'Amount', dataIndex: 'amount' },
  { title: 'Type', dataIndex: 'type' },
  { title: 'Payment Status', dataIndex: 'payment_status' },
  { title: 'Payment Type', dataIndex: 'payment_type' },
  { title: 'Note', dataIndex: 'note' },
  { title: 'Date', dataIndex: 'createdAt' },
]

const columns = [
  { title: 'Customer', key: 'user', width: '25%' },
  { title: 'Amount', key: 'amount', align: 'right' },
   { title: 'Is Pass', key: 'is_pass', align: 'right' },
  { title: 'Type', key: 'type', align: 'center' },
  { title: 'Payment Status', dataIndex: 'payment_status', key: 'payment_status', align: 'center' },
   { title: 'Payment Type', dataIndex: 'payment_type', key: 'payment_type', align: 'center' },
  // { title: 'Note / Reason', dataIndex: 'note' },
  { title: 'Date / Reason', key: 'createdAt', align: 'right' },
]

onMounted(() => {
  fetchHistory()
})

const fetchHistory = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      search: filters.search,
      type: filters.type,
      sortBy:'createdAt',
      sortDesc:'desc',
      startDate: filters.dateRange?.length ? filters.dateRange[0].format('YYYY-MM-DD') : null,
      endDate: filters.dateRange?.length ? filters.dateRange[1].format('YYYY-MM-DD') : null,
    }
    const response = await customerService.getWalletHistory(route.query.id,params)
    const items = response.items || response.data?.items || []
    transactions.value = items.map((item, index) => ({
      ...item,
      id: item.ids || item._id || item.id || index,
      user: {
        ...item.user,
        fullname: `${item.user?.firstname || ''} ${item.user?.lastname || ''}`.trim()
      }
    }))
    pagination.total = response.totalRecords || response.data?.total || 0
    selectedRowKeys.value = []
    selectedRows.value = []
  } catch (error) {
    message.error('Failed to load wallet history')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchHistory()
}

const resetFilters = () => {
  filters.search = ''
  filters.type = undefined
  filters.dateRange = []
  handleSearch()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchHistory()
}

const getStatusColor = (status) => {
  const s = status?.toString().toLowerCase()
  if (s === 'success' || s === 'completed' || s === 'wallet'|| s === 'Yes') return 'success'
  if (s === 'pending' || s === 'trip') return 'warning'
  if (s === 'failed' || s === 'pass' || s === 'cancelled') return 'error'
  if (s === 'refunded') return 'processing'
  return 'default'
}

const getStatusText = (status) => {
  const s = status?.toString().toLowerCase()
  if (s === '1' || s === 'success') return 'Success'
  if (s === '0' || s === 'pending') return 'Pending'
  if (s === '2' || s === 'failed') return 'Failed'
    if (s === 'Yes') return 'Yes'
    if (s === 'No') return 'No'
  return status || 'N/A'
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
