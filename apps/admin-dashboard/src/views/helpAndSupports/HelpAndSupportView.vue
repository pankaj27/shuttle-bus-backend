<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-4">
        <a-button
          @click="$router.push({ name: 'dashboard' })"
          type="text"
          class="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <template #icon><LucideIcon name="ArrowLeft" :size="20" /></template>
        </a-button>
        <div>
          <h2 class="text-2xl font-bold text-gray-900 m-0">Help & Support</h2>
          <p class="text-gray-500 m-0 text-sm">Review help and support records</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <ExportExcel 
          :data="selectedRows" 
          :columns="exportColumns" 
          filename="help-and-support"
          v-if="selectedRowKeys.length > 0"
        />
      </div>
    </div>

    <!-- Filters -->
    <a-card :bordered="false" class="shadow-sm rounded-3xl mb-6 overflow-hidden">
      <div class="flex flex-wrap gap-4 items-center">
        <a-input
          v-model:value="filters.search"
          placeholder="Search by ticket, name or phone..."
          class="w-full md:w-80 rounded-xl"
          @input="handleSearch"
        >
           <template #prefix><LucideIcon name="Search" :size="16" class="text-gray-400" /></template>
        </a-input>

        <a-select v-model:value="filters.status" placeholder="Status" class="w-full md:w-40" allow-clear @change="handleSearch">
           <a-select-option value="Pending">Pending</a-select-option>
           <a-select-option value="InProgress">In Progress</a-select-option>
           <a-select-option value="Resolved">Resolved</a-select-option>
           <a-select-option value="Closed">Closed</a-select-option>
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
        :data-source="helpAndSupports"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        row-key="id"
        @change="handleTableChange"
        class="custom-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'fullname'">
            <div class="flex flex-col">
              <span class="font-semibold text-gray-800 text-sm">{{ record.fullname }}</span>
              <span class="text-[10px] text-gray-400 font-medium">{{ record.email }}</span>
            </div>
          </template>

          <template v-if="column.key === 'ticket_no'">
             <a-tag color="blue" class="rounded-lg px-2 font-mono text-[10px]">{{ record.ticket_no }}</a-tag>
          </template>

          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)" class="rounded-lg px-3 uppercase text-[10px] font-bold">
              {{ record.status || 'Pending' }}
            </a-tag>
          </template>

          <template v-if="column.key === 'createdAt'">
             <span class="text-gray-500 text-xs">{{ record.createdAt }}</span>
          </template>

          <template v-if="column.key === 'actions'">
            <a-dropdown :trigger="['click']">
              <a-button type="text" class="flex items-center justify-center hover:bg-gray-100 rounded-lg h-8 w-8 p-0">
                <LucideIcon name="MoreVertical" :size="20" class="text-gray-500" />
              </a-button>
              <template #overlay>
                <a-menu class="rounded-xl shadow-lg border border-gray-100 min-w-[140px] p-1">
                  <a-menu-item key="view" @click="viewDetail(record)" class="rounded-lg hover:bg-blue-50 group">
                    <div class="flex items-center gap-2 py-1">
                      <LucideIcon name="Eye" :size="16" class="text-blue-500 group-hover:scale-110 transition-transform" />
                      <span class="text-gray-700 font-medium text-sm">View Details</span>
                    </div>
                  </a-menu-item>
                  <a-tooltip :title="canEdit ? '' : 'No Permission to Reply'">
                    <a-menu-item key="reply" @click="openReplyModal(record)" class="rounded-lg hover:bg-green-50 group">
                      <div class="flex items-center gap-2 py-1" :class="canEdit ? 'text-green-600' : 'text-gray-300'">
                        <LucideIcon name="MessageSquareQuote" :size="16" class="group-hover:scale-110 transition-transform" />
                        <span class="font-medium text-sm">Reply</span>
                      </div>
                    </a-menu-item>
                  </a-tooltip>
                  <a-menu-divider />
                  <a-tooltip :title="canDelete ? '' : 'No Permission to Delete'">
                    <a-menu-item key="delete" class="rounded-lg hover:bg-red-50 group" @click="!canDelete && message.error('You do not have permission to delete tickets')">
                      <a-popconfirm
                        v-if="canDelete"
                        title="Are you sure you want to delete this ticket?"
                        @confirm="handleDelete(record.id)"
                        ok-text="Yes"
                        cancel-text="No"
                        placement="left"
                      >
                        <div class="flex items-center gap-2 py-1">
                          <LucideIcon name="Trash2" :size="16" class="text-red-500 group-hover:scale-110 transition-transform" />
                          <span class="text-red-600 font-medium text-sm">Delete Ticket</span>
                        </div>
                      </a-popconfirm>
                      <div v-else class="flex items-center gap-2 py-1 text-gray-300">
                        <LucideIcon name="Trash2" :size="16" />
                        <span class="font-medium text-sm">Delete Ticket</span>
                      </div>
                    </a-menu-item>
                  </a-tooltip>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </template>
      </a-table>
    </div>

    <!-- Modals -->
    <HelpAndSupportDetailModal 
      :visible="modalVisible" 
      :record="selectedRecord" 
      @close="modalVisible = false" 
    />

    <HelpAndSupportReplyModal 
      :visible="replyModalVisible" 
      :record="selectedRecord" 
      @close="replyModalVisible = false" 
      @success="handleReplySuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import LucideIcon from '@/components/LucideIcon.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import ExportExcel from '@/components/ExportExcel.vue'
import { helpAndSupportService } from '@/services/helpandsupport.service'

// Components
import HelpAndSupportDetailModal from './components/HelpAndSupportDetailModal.vue'
import HelpAndSupportReplyModal from './components/HelpAndSupportReplyModal.vue'

const authStore = useAuthStore()
const canEdit = computed(() => authStore.hasPermission('help.support.edit'))
const canDelete = computed(() => authStore.hasPermission('help.support.delete'))

const loading = ref(false)
const helpAndSupports = ref([])
const modalVisible = ref(false)
const replyModalVisible = ref(false)
const selectedRecord = ref(null)

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

const viewDetail = (record) => {
  selectedRecord.value = record
  modalVisible.value = true
}

const openReplyModal = (record) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Replying to support tickets is disabled in Demo Mode.',
    });
    return;
  }
  if (canEdit.value) {
    selectedRecord.value = record
    replyModalVisible.value = true
  } else {
    message.error('You do not have permission to reply to tickets')
  }
}

const handleReplySuccess = () => {
  replyModalVisible.value = false
  fetchHelpAndSupport()
}

const exportColumns = [
  { title: 'Ticket No', dataIndex: 'ticket_no' },
  { title: 'Fullname', dataIndex: 'fullname' },
  { title: 'Email', dataIndex: 'email' },
  { title: 'Phone', dataIndex: 'phone' },
  { title: 'Subject', dataIndex: 'subject' },
  { title: 'Message', dataIndex: 'description_short' },
  { title: 'Status', dataIndex: 'status' },
  { title: 'Replies', dataIndex: 'export_replies' },
  { title: 'Date', dataIndex: 'createdAt' },
]

const columns = [
  { title: 'Ticket No', key: 'ticket_no', width: '120px' },
  { title: 'User Info', key: 'fullname' },
  { title: 'Phone', dataIndex: 'phone', key: 'phone' },
  { title: 'Message', dataIndex: 'subject', key: 'subject', ellipsis: true },
  { title: 'Status', key: 'status', align: 'center', width: '120px' },
  { title: 'Date', key: 'createdAt', align: 'right', width: '180px' },
  { title: 'Actions', key: 'actions', align: 'right', width: '100px' },
]

onMounted(() => {
  fetchHelpAndSupport()
})

const fetchHelpAndSupport = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      search: filters.search,
      status: filters.status,
      sortBy: 'createdAt',
      sortDesc: 'desc',
      startDate: filters.dateRange?.length ? filters.dateRange[0].format('YYYY-MM-DD') : null,
      endDate: filters.dateRange?.length ? filters.dateRange[1].format('YYYY-MM-DD') : null,
    }
    const response = await helpAndSupportService.getAll(params)
    
    const items = response.items || response.data?.items || (Array.isArray(response.data) ? response.data : [])
    helpAndSupports.value = helpAndSupportService.transform(items)
    
    pagination.total = response.totalRecords || response.total || response.data?.total || 0
    selectedRowKeys.value = []
    selectedRows.value = []
  } catch (error) {
    console.error('Fetch error:', error)
    message.error('Failed to load help and support records')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchHelpAndSupport()
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
  fetchHelpAndSupport()
}

const getStatusColor = (status) => {
  const s = status?.toString().toLowerCase()
  if (s === 'resolved' || s === 'completed' || s === 'closed' || s === 'true') return 'success'
  if (s === 'inprogress' || s === 'processing') return 'processing'
  if (s === 'pending') return 'warning'
  if (s === 'false') return 'error'
  return 'default'
}

const handleDelete = async (id) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Deleting support tickets is disabled in Demo Mode.',
    });
    return;
  }
  if (!canDelete.value) {
    message.error('You do not have permission to delete tickets')
    return
  }
  try {
    await helpAndSupportService.delete(id)
    message.success('Help and support deleted successfully')
    fetchHelpAndSupport()
  } catch (error) {
    message.error('Failed to delete record')
  }
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