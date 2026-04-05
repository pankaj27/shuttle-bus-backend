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
          <h2 class="text-2xl font-bold text-gray-900 m-0">Referral Histories</h2>
          <p class="text-gray-500 m-0 text-sm">Review referral records and rewards</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <ExportExcel 
          :data="selectedRows" 
          :columns="exportColumns" 
          filename="referral-history"
          v-if="selectedRowKeys.length > 0"
        />
      </div>
    </div>

    <!-- Filters -->
    <a-card :bordered="false" class="shadow-sm rounded-3xl mb-6 overflow-hidden">
      <div class="flex flex-wrap gap-4 items-center">
        <a-input
          v-model:value="filters.search"
          placeholder="Search by name or phone..."
          class="w-full md:w-80 rounded-xl"
          @input="handleSearch"
        >
           <template #prefix><LucideIcon name="Search" :size="16" class="text-gray-400" /></template>
        </a-input>

        <a-select v-model:value="filters.status" placeholder="Status" class="w-full md:w-40" allow-clear @change="handleSearch">
           <a-select-option value="Completed">Completed</a-select-option>
           <a-select-option value="Pending">Pending</a-select-option>
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
          <template v-if="column.key === 'user'">
            <div class="flex items-center gap-3">
              <a-avatar :src="record.user?.ProfilePic" :size="32">
                 <template #icon><LucideIcon name="User" :size="14" /></template>
              </a-avatar>
              <div class="flex flex-col">
                <span class="font-semibold text-gray-800 text-sm">{{ record.user?.firstname }} {{ record.user?.lastname }}</span>
                <span class="text-[10px] text-gray-400 font-medium">{{ record.user?.phone }}</span>
              </div>
            </div>
          </template>

          <template v-if="column.key === 'referral'">
            <div class="flex items-center gap-3">
              <a-avatar :src="record.referral?.ProfilePic" :size="32">
                 <template #icon><LucideIcon name="User" :size="14" /></template>
              </a-avatar>
              <div class="flex flex-col">
                <span class="font-semibold text-gray-800 text-sm">{{ record.referral?.firstname }} {{ record.referral?.lastname }}</span>
                <span class="text-[10px] text-gray-400 font-medium">{{ record.referral?.phone }}</span>
              </div>
            </div>
          </template>

          <template v-if="column.key === 'validity'">
            <div class="flex flex-col text-xs">
              <span class="text-gray-600">From: {{ record.start_date }}</span>
              <span class="text-gray-400">To: {{ record.end_date }}</span>
            </div>
          </template>

          <template v-if="column.key === 'payment_status'">
            <a-tag :color="getStatusColor(record.payment_status)" class="rounded-lg px-3 uppercase text-[10px] font-bold">
              {{ getStatusText(record.payment_status) }}
            </a-tag>
          </template>

          <template v-if="column.key === 'createdAt'">
             <span class="text-gray-500 text-xs">{{ formatDate(record.createdAt) }}</span>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import LucideIcon from '@/components/LucideIcon.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import ExportExcel from '@/components/ExportExcel.vue'
import { customerService } from '@/services/customer.service'
import { formatDate } from '@/utils/date'

const loading = ref(false)
const transactions = ref([])

const filters = reactive({
  search: '',
  status: undefined,
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
  { title: 'New User', dataIndex: 'user.fullname' },
  { title: 'New User Phone', dataIndex: 'user.phone' },
  { title: 'Referred By', dataIndex: 'referral.fullname' },
  { title: 'Referred By Phone', dataIndex: 'referral.phone' },
  { title: 'Amount', dataIndex: 'amount' },
  { title: 'Pending Amount', dataIndex: 'pending_amount' },
  { title: 'Validity Start', dataIndex: 'start_date' },
  { title: 'Validity End', dataIndex: 'end_date' },
  { title: 'Status', dataIndex: 'payment_status' },
  { title: 'Date', dataIndex: 'createdAt' },
]

const columns = [
  { title: 'New User', key: 'user', width: '20%' },
  { title: 'Referred By', key: 'referral', width: '20%' },
  { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right' },
  { title: 'Pending', dataIndex: 'pending_amount', key: 'pending_amount', align: 'right' },
  { title: 'Validity', key: 'validity' },
  { title: 'Status', key: 'payment_status', align: 'center' },
  { title: 'Date', key: 'createdAt', align: 'right' },
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
      status: filters.status,
      sortBy:'createdAt',
      sortDesc:'desc',
      startDate: filters.dateRange?.length ? filters.dateRange[0].format('YYYY-MM-DD') : null,
      endDate: filters.dateRange?.length ? filters.dateRange[1].format('YYYY-MM-DD') : null,
    }
    const response = await customerService.getAllReferrals(params)
    const items = response.referrals || response.data?.referrals || []
    transactions.value = items.map((item, index) => ({
      ...item,
      id: item._id || index,
      user: {
        ...item.user,
        fullname: `${item.user?.firstname || ''} ${item.user?.lastname || ''}`.trim()
      },
      referral: {
        ...item.referral,
        fullname: `${item.referral?.firstname || ''} ${item.referral?.lastname || ''}`.trim()
      }
    }))
    pagination.total = response.totalRecords || response.data?.total || 0
    selectedRowKeys.value = []
    selectedRows.value = []
  } catch (error) {
    message.error('Failed to load referral history')
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
  filters.status = undefined
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
  if (s === 'success' || s === 'completed' || s === 'active' || s === 'yes') return 'success'
  if (s === 'pending' || s === 'processing') return 'warning'
  if (s === 'failed' || s === 'cancelled' || s === 'no') return 'error'
  return 'default'
}

const getStatusText = (status) => {
  const s = status?.toString().toLowerCase()
  if (s === '1' || s === 'success' || s === 'completed') return 'Completed'
  if (s === '0' || s === 'pending') return 'Pending'
  if (s === '2' || s === 'failed') return 'Failed'
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
