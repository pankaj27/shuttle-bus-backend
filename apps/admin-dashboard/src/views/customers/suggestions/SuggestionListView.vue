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
          <h2 class="text-2xl font-bold text-gray-900 m-0">Route Suggestions</h2>
          <p class="text-gray-500 m-0 text-sm">Review pickup and drop-off points suggested by users</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <ExportExcel 
          :data="selectedRows" 
          :columns="exportColumns" 
          filename="route-suggestions"
          v-if="selectedRowKeys.length > 0"
        />
      </div>
    </div>

    <!-- Filters -->
    <a-card :bordered="false" class="shadow-sm rounded-3xl mb-6 overflow-hidden">
      <div class="flex flex-wrap gap-4 items-center">
        <a-input
          v-model:value="filters.search"
          placeholder="Search by address or user..."
          class="w-full md:w-80 rounded-xl"
          @input="handleSearch"
        >
           <template #prefix><LucideIcon name="Search" :size="16" class="text-gray-400" /></template>
        </a-input>

        <DateRangeFilter v-model:value="filters.dateRange" class="w-full md:w-80 mr-2" @change="handleSearch" />

        <a-button @click="resetFilters" class="">
           <LucideIcon name="RotateCcw" :size="18" />
        </a-button>
      </div>
    </a-card>

    <SuggestionDetailDrawer 
      :visible="drawerVisible" 
      :suggestion="selectedSuggestion" 
      @close="drawerVisible = false" 
    />

    <!-- Table -->
    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <a-table
        :columns="columns"
        :data-source="suggestions"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        row-key="id"
        @change="handleTableChange"
        class="custom-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'user'">
            <div class="flex flex-col">
              <span class="font-semibold text-gray-800 text-sm">{{ record.fullname || 'Guest / App User' }}</span>
              <span class="text-[10px] text-gray-400 font-medium">{{ record.phone || 'N/A' }}</span>
            </div>
          </template>

          <template v-if="column.key === 'pickup'">
            <div class="flex items-start gap-2 max-w-md">
              <LucideIcon name="MapPin" :size="14" class="text-green-500 mt-1 shrink-0" />
              <span class="text-sm text-gray-700">{{ record.pickup_address }}</span>
            </div>
          </template>

          <template v-if="column.key === 'drop'">
            <div class="flex items-start gap-2 max-w-md">
              <LucideIcon name="MapPin" :size="14" class="text-red-500 mt-1 shrink-0" />
              <span class="text-sm text-gray-700">{{ record.drop_address }}</span>
            </div>
          </template>

          <template v-if="column.key === 'createdAt'">
             <span class="text-gray-500 text-xs">{{ formatDate(record.createdAt) }}</span>
          </template>

          <template v-if="column.key === 'action'">
            <a-button type="text" @click="viewDetail(record)" class="flex items-center justify-center hover:bg-blue-50 rounded-lg h-9 w-9 p-0">
               <LucideIcon name="Eye" :size="16" class="text-blue-500" />
            </a-button>
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
import SuggestionDetailDrawer from './components/SuggestionDetailDrawer.vue'
import { customerService } from '@/services/customer.service'
import { formatDate } from '@/utils/date'

const loading = ref(false)
const suggestions = ref([])
const drawerVisible = ref(false)
const selectedSuggestion = ref(null)

const filters = reactive({
  search: '',
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
  { title: 'User Name', dataIndex: 'fullname' },
  { title: 'User Phone', dataIndex: 'phone' },
  { title: 'Pickup Address', dataIndex: 'pickup_address' },
  { title: 'Drop Address', dataIndex: 'drop_address' },
  { title: 'Suggested Date', dataIndex: 'createdAt' },
]

const columns = [
  { title: 'User', key: 'user', width: '20%' },
  { title: 'Pickup Location', key: 'pickup', width: '25%' },
  { title: 'Drop-off Location', key: 'drop', width: '25%' },
  { title: 'Date', key: 'createdAt', align: 'center' },
  { title: 'Actions', key: 'action', align: 'center', width: 80 },
]

const viewDetail = (record) => {
  selectedSuggestion.value = record
  drawerVisible.value = true
}

onMounted(() => {
  fetchSuggestions()
})

const fetchSuggestions = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      search: filters.search,
      startDate: filters.dateRange?.length ? filters.dateRange[0].format('YYYY-MM-DD') : null,
      endDate: filters.dateRange?.length ? filters.dateRange[1].format('YYYY-MM-DD') : null,
    }
    const response = await customerService.getAllSuggestions(params)
    
    // Support nested data structure if present
    const rawData = response.data || response
    const items = rawData.items || rawData.suggests || []
    
    suggestions.value = items.map((item, index) => ({
      ...item,
      id: item.ids || item.id || index, // fallback for key
    }))
    
    pagination.total = rawData.totalRecords || 0
    selectedRowKeys.value = []
    selectedRows.value = []
  } catch (error) {
    console.error('Failed to load suggestions:', error)
    message.error('Failed to load route suggestions')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchSuggestions()
}

const resetFilters = () => {
  filters.search = ''
  filters.dateRange = []
  handleSearch()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchSuggestions()
}
</script>

<style scoped>
@reference "tailwindcss";

:deep(.custom-table .ant-table-thead > tr > th) {
  @apply bg-gray-50/50 text-gray-500 font-bold text-xs uppercase tracking-wider;
}

:deep(.ant-input) {
  @apply rounded-xl border-gray-200;
}
</style>
