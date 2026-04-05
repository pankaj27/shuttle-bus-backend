<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 m-0">Bookings</h2>
          <p class="text-gray-500 m-0 text-sm">Manage and track travel bookings</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <ExportExcel 
          :data="selectedRows" 
          :columns="exportColumns" 
          filename="bookings-list"
          v-if="selectedRowKeys.length > 0"
        />
        <a-button type="primary" class="rounded-xl flex items-center gap-2 h-10 px-4 shadow-sm" @click="refresh">
          <LucideIcon name="RotateCcw" :size="18" />
          <span>Refresh</span>
        </a-button>
      </div>
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
        :data-source="bookings"
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
              <span class="text-[10px] text-gray-400 font-medium">{{ record.customer_phone }}</span>
            </div>
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

          <template v-if="column.key === 'bus'">
            <div class="flex flex-col">
              <span class="text-xs font-medium text-gray-700">{{ record.bus_name }}</span>
              <span class="text-[10px] text-gray-400">{{ record.bus_model_no }}</span>
            </div>
          </template>

          <template v-if="column.key === 'fare'">
            <span class="font-bold text-gray-900">{{ record.final_total_fare }}</span>
          </template>

              <template v-if="column.key === 'seat_nos'">
                <a-tag  v-for="seat in record.seat_nos" color="success">
                  {{seat}}
                </a-tag>

              </template>

          <template v-if="column.key === 'travel_status'">
            <a-tag :color="getTravelStatusColor(record.travel_status)" class="rounded-lg px-3 uppercase text-[10px] font-bold">
              {{ record.travel_status }}
            </a-tag>
          </template>

          <template v-if="column.key === 'payment_status'">
            <a-tag :color="getPaymentStatusColor(record.payment_status)" class="rounded-lg px-2 text-[10px] font-semibold border-none bg-opacity-10" :style="{ backgroundColor: getPaymentStatusBg(record.payment_status), color: getPaymentStatusColor(record.payment_status) }">
              {{ record.payment_status }}
            </a-tag>
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
                  <!-- <a-menu-item v-if="record.travel_status === 'ONBOARDED'" key="track" class="rounded-lg hover:bg-indigo-50 group">
                    <div class="flex items-center gap-2 py-1">
                      <LucideIcon name="MapPin" :size="16" class="text-indigo-500 group-hover:scale-110 transition-transform" />
                      <span class="text-gray-700 font-medium text-sm">Track Bus</span>
                    </div>
                  </a-menu-item> -->
                   <a-menu-divider v-if="record.travel_status === 'SCHEDULE' || record.travel_status === 'SCHEDULED'" />
                  <a-tooltip :title="canEdit ? '' : 'No Permission to Update Status'">
                    <a-menu-item @click="openStatusModal(record)" key="cancel" class="rounded-lg hover:bg-blue-50 group" v-if="record.travel_status === 'SCHEDULE' || record.travel_status === 'SCHEDULED'">
                      <div class="flex items-center gap-2 py-1" :class="canEdit ? 'text-blue-600' : 'text-gray-300'">
                        <LucideIcon name="Pencil" :size="16" class="group-hover:scale-110 transition-transform" />
                        <span class="font-medium text-sm">Update Booking Status</span>
                      </div>
                    </a-menu-item> 
                  </a-tooltip>
                        <a-menu-divider v-if="record.travel_status === 'COMPLETED'" />
                    <a-menu-item v-if="record.travel_status === 'COMPLETED'"  key="download">
                      <a-popconfirm
                        title="Are you sure you want to download this invoice?"
                        ok-text="Yes"
                        cancel-text="No"
                        @confirm="handleDownload(record)"
                      >
                        <div class="flex items-center gap-2 text-blue-500">
                          <LucideIcon name="Download" :size="16" />
                          <span>Download Invoice</span>
                        </div>
                      </a-popconfirm>
                    </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </template>
      </a-table>

         <!-- Booking Detail Drawer -->
    <BookingDetailDrawer
      v-model:visible="drawerVisible"
      :booking="selectedBooking"
      @close="selectedBooking = null"
    />

    <!-- Update Status Modal -->
    <a-modal
      v-model:open="statusModalVisible"
      title="Update Booking Status"
      :confirm-loading="statusLoading"
      @ok="handleStatusUpdate"
      @cancel="closeStatusModal"
      :width="500"
    >
      <div class="py-4">
        <p class="text-sm text-gray-600 mb-4">
          Update the travel status for booking <span class="font-mono font-bold text-blue-600">{{ selectedBookingForStatus?.pnr_no }}</span>
        </p>
        <a-form layout="vertical">
          <a-form-item label="Select New Status">
            <a-select
              v-model:value="newStatus"
              size="large"
              placeholder="Choose a status"
              class="w-full"
            >
              <a-select-option value="SCHEDULED">
                <div class="flex items-center gap-2">
                  <LucideIcon name="Calendar" :size="16" class="text-blue-500" />
                  <span>Scheduled</span>
                </div>
              </a-select-option>
              <a-select-option value="ONBOARDED">
                <div class="flex items-center gap-2">
                  <LucideIcon name="UserCheck" :size="16" class="text-green-500" />
                  <span>OnBoarded</span>
                </div>
              </a-select-option>
              <a-select-option value="COMPLETED">
                <div class="flex items-center gap-2">
                  <LucideIcon name="CheckCircle" :size="16" class="text-green-600" />
                  <span>Completed</span>
                </div>
              </a-select-option>
              <a-select-option value="CANCELLED">
                <div class="flex items-center gap-2">
                  <LucideIcon name="XCircle" :size="16" class="text-red-500" />
                  <span>Cancelled</span>
                </div>
              </a-select-option>
              <a-select-option value="EXPIRED">
                <div class="flex items-center gap-2">
                  <LucideIcon name="Clock" :size="16" class="text-gray-500" />
                  <span>Expired</span>
                </div>
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    </div>
    
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useBooking } from '@/composables/useBooking'
import { useAuthStore } from '@/stores/auth'
import LucideIcon from '@/components/LucideIcon.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import ExportExcel from '@/components/ExportExcel.vue'
import  BookingDetailDrawer from "./components/BookingDetail.vue"
import { formatDate } from '@/utils/date'
import { bookingService } from '@/services/booking.service'
import { message } from 'ant-design-vue'

const drawerVisible = ref(false)
const selectedBooking = ref(null)

// Status update modal state
const statusModalVisible = ref(false)
const selectedBookingForStatus = ref(null)
const newStatus = ref('')
const statusLoading = ref(false)

const authStore = useAuthStore()
const { generalSettings } = authStore
const default_currency = ref(generalSettings.default_currency)

const canEdit = computed(() => authStore.hasPermission('booking.edit') || authStore.hasPermission('manage.trips.view'))

const {
  loading,
  searchText,
  activeTab,
  bookings,
  pagination,
  columns,
  refresh,
  handleTableChange,
  handleTabChange,
  handleSearch,
  dateRange,
  exportColumns,
} = useBooking()

const selectedRowKeys = ref([])
const selectedRows = ref([])

const rowSelection = {
  onChange: (keys, rows) => {
    selectedRowKeys.value = keys
    selectedRows.value = rows
  }
}

watch(bookings, () => {
  selectedRowKeys.value = []
  selectedRows.value = []
})

const statusOptions = [
  { label: 'All Bookings', value: 'all' },
  { label: 'Scheduled', value: 'Scheduled' },
  { label: 'OnBoarded', value: 'OnBoarded' },
    { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
  { label: 'Expired', value: 'Expired' },
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

const openStatusModal = (record) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating booking status is disabled in Demo Mode.',
    });
    return;
  }
  if (canEdit.value) {
    selectedBookingForStatus.value = record
    newStatus.value = record.travel_status
    statusModalVisible.value = true
  } else {
    message.error('You do not have permission to update booking status')
  }
}

const closeStatusModal = () => {
  statusModalVisible.value = false
  selectedBookingForStatus.value = null
  newStatus.value = ''
}

const handleDownload = async (record) => {
  try {
    message.loading({ content: 'Generating Invoice...', key: 'download' })
    const response = await bookingService.downloadInvoice(record.pnr_no)
    
    // Create a Blob from the PDF data
    const blob = new Blob([response], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    
    // Open the PDF in a new tab
    window.open(url, '_blank')
    
    // Clean up the URL object after some time to ensure it opens correctly
    setTimeout(() => window.URL.revokeObjectURL(url), 100)
    
    message.success({ content: 'Invoice generated successfully', key: 'download' })
  } catch (error) {
    console.error('Download error:', error)
    message.error({ content: error.response?.data?.message || 'Failed to generate invoice', key: 'download' })
  }
}

const handleStatusUpdate = async () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating booking status is disabled in Demo Mode.',
    });
    return;
  }
  if (!canEdit.value) {
    message.error('You do not have permission to update booking status')
    return
  }
  if (!newStatus.value) {
    message.warning('Please select a status')
    return
  }

  try {
    statusLoading.value = true
    await bookingService.updateStatus(selectedBookingForStatus.value.id, newStatus.value)
    message.success('Booking status updated successfully')
    closeStatusModal()
    refresh()
  } catch (error) {
    console.error('Status update error:', error)
    message.error(error.response?.data?.message || 'Failed to update booking status')
  } finally {
    statusLoading.value = false
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
  @apply rounded-xl border-gray-200!;
}
</style>
