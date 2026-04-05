<script setup>
import { ref, watch,computed } from 'vue'
import { useRouter } from 'vue-router'
import LucideIcon from '@/components/LucideIcon.vue'
import ExportExcel from '@/components/ExportExcel.vue'
import { useTripAssign } from '@/composables/useTripAssign'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { message, Modal } from 'ant-design-vue'
import { minutesToTime } from '@/utils/time'
import { formatDate } from '@/utils/date'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const {
  loading,
  searchText,
  activeTab,
  tripAssigns,
  pagination,
  columns,
  handleTableChange,
  refresh,
  handleTabChange,
  handleStatusChange,
  handleDelete,
} = useTripAssign()

const canCreate = computed(() => authStore.hasPermission('booking.assigns.create'))
const canEdit = computed(() => authStore.hasPermission('booking.assigns.edit'))
const canDelete = computed(() => authStore.hasPermission('booking.assigns.delete'))

const handleCreate = () => {
  if (canCreate.value) {
    router.push({ name: 'trips-create' })
  } else {
    message.error('You do not have permission to create assignments')
  }
}

const handleEdit = (record) => {
  if (canEdit.value) {
    router.push({ name: 'trips-edit', params: { id: record.id } })
  } else {
    message.error('You do not have permission to edit assignments')
  }
}

const onDeleteConfirm = (record) => {
  if (canDelete.value) {
    handleDelete(record)
  } else {
    message.error('You do not have permission to delete assignments')
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'COMPLETED':
      return 'green'
    case 'ASSIGNED':
      return 'orange'
    case 'STARTED':
      return 'blue'
    case 'RIDING':
      return 'cyan'
    case 'EXPIRED':
      return 'red'
    case 'NOTSTARTED':
      return 'purple'
    default:
      return 'default'
  }
}

const selectedRowKeys = ref([])
const selectedRows = ref([])

const rowSelection = {
  onChange: (keys, rows) => {
    selectedRowKeys.value = keys
    selectedRows.value = rows
  },
}

const exportColumns = [
  { title: 'Route Name', dataIndex: 'route_name' },
  { title: 'Departure Time', dataIndex: 'departure_time', format: (val) => minutesToTime(val) },
  { title: 'Arrival Time', dataIndex: 'arrival_time', format: (val) => minutesToTime(val) },
  { title: 'Driver Name', dataIndex: 'driver_name' },
  { title: 'Driver Phone', dataIndex: 'driver_phone' },
  { title: 'Assistant', dataIndex: 'assistantId' },
  { title: 'Assistant Phone', dataIndex: 'assistant_phone' },
  { title: 'Status', dataIndex: 'status' },
  {
    title: 'Dates',
    dataIndex: 'dates',
    format: (val) => (Array.isArray(val) ? val.map((d) => formatDate(d)).join(', ') : ''),
  },
]

watch(tripAssigns, () => {
  selectedRowKeys.value = []
  selectedRows.value = []
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex justify-between items-center p-6 rounded-3xl border shadow-sm transition-colors duration-300"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
    >
      <div class="flex items-center gap-4">
        <div
          class="p-3 rounded-2xl transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'"
        >
          <LucideIcon name="CalendarDays" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Trip Assignments
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Manage driver and bus assignments to routes
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <ExportExcel
          v-if="selectedRowKeys.length > 0"
          :data="selectedRows"
          :columns="exportColumns"
          filename="trip-assignments-list"
        />
        <a-button
          type="primary"
          size="large"
          class="create-btn bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
          @click="handleCreate"
        >
          <template #icon><LucideIcon name="Plus" :size="18" class="mr-2" /></template>
          Create Assignment
        </a-button>
      </div>
    </div>

    <!-- Filters & Tabs -->
    <div
      class="p-6 rounded-3xl border shadow-sm transition-colors duration-300"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
    >
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div class="w-full md:w-auto">
          <a-input
            v-model:value="searchText"
            placeholder="Search assignments..."
            class="search-input w-full md:w-80"
            @change="handleTabChange"
          >
            <template #prefix>
              <LucideIcon name="Search" :size="16" class="text-gray-400" />
            </template>
          </a-input>
        </div>

        <div class="flex items-center gap-3">
          <a-button class="refresh-btn" @click="refresh" title="Refresh">
            <LucideIcon name="RefreshCw" :size="16" />
          </a-button>
        </div>
      </div>

      <a-tabs v-model:activeKey="activeTab" class="custom-tabs" @change="handleTabChange">
        <a-tab-pane key="all" tab="All" />
        <a-tab-pane key="ASSIGNED" tab="Assigned" />
        <a-tab-pane key="STARTED" tab="Started" />
        <a-tab-pane key="RIDING" tab="Riding" />
        <a-tab-pane key="COMPLETED" tab="Completed" />
        <a-tab-pane key="NOTSTARTED" tab="Not Started" />
        <a-tab-pane key="EXPIRED" tab="Expired" />
      </a-tabs>

      <!-- Table -->
      <a-table
        :columns="columns"
        :dataSource="tripAssigns"
        :loading="loading"
        v-model:pagination="pagination"
        :row-selection="rowSelection"
        @change="handleTableChange"
        rowKey="id"
        class="ant-table-striped"
      >
        <template #bodyCell="{ column, record }">
          <!-- Route Column -->
          <template v-if="column.key === 'route_name'">
            <div class="flex flex-col">
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                record.route_name
              }}</span>
              <span class="text-xs text-gray-500">
                {{ minutesToTime(record.departure_time) }} -
                {{ minutesToTime(record.arrival_time) }}
              </span>
            </div>
          </template>

          <!-- Driver Column -->
          <template v-if="column.key === 'driver_name'">
            <div class="flex items-center gap-3">
              <a-avatar :src="record.driver_picture" :size="40">
                <template #icon><LucideIcon name="User" :size="20" /></template>
              </a-avatar>
              <div class="flex flex-col">
                <span class="font-semibold text-gray-800">{{ record.driver_name }}</span>
                <span class="text-xs text-gray-400 capitalize">{{ record.driver_phone }}</span>
              </div>
            </div>
          </template>

                <!-- Driver Column -->
          <template v-if="column.key === 'assistantId'">
            <div class="flex items-center gap-3">
              <a-avatar :src="record.assistant_picture" :size="40">
                <template #icon><LucideIcon name="User" :size="20" /></template>
              </a-avatar>
              <div class="flex flex-col">
                <span class="font-semibold text-gray-800">{{ record.assistantId }}</span>
                <span class="text-xs text-gray-400 capitalize">{{ record.assistant_phone }}</span>
              </div>
            </div>
          </template>



          <!-- Dates Column -->
          <template v-if="column.key === 'dates'">
            <div class="flex flex-wrap gap-1 max-w-[200px]">
              <a-tag v-for="date in record.dates" :key="date" color="blue" class="text-[10px] m-0">
                {{ formatDate(date) }}
              </a-tag>
            </div>
          </template>

          <!-- Status Column -->
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ record.status }}
            </a-tag>
          </template>

          <!-- Action Column -->
          <template v-if="column.key === 'action'">
            <div class="flex justify-end gap-2">
              <a-tooltip :title="canEdit ? 'Edit' : 'No Permission to Edit'">
                <a-button
                  type="text"
                  class="rounded-lg p-2"
                  @click="handleEdit(record)"
                >
                  <LucideIcon name="Edit" :size="16" :class="canEdit ? 'text-blue-500' : 'text-gray-300'" />
                </a-button>
              </a-tooltip>
              <a-tooltip :title="canDelete ? 'Delete' : 'No Permission to Delete'">
                <a-popconfirm
                  v-if="canDelete"
                  title="Are you sure you want to delete this assignment?"
                  ok-text="Yes"
                  cancel-text="No"
                  @confirm="onDeleteConfirm(record)"
                >
                  <a-button type="text" class="text-red-500 hover:bg-red-50 rounded-lg p-2">
                    <LucideIcon name="Trash2" :size="16" />
                  </a-button>
                </a-popconfirm>
                <a-button v-else type="text" class="rounded-lg p-2" @click="onDeleteConfirm(record)">
                  <LucideIcon name="Trash2" :size="16" class="text-gray-300" />
                </a-button>
              </a-tooltip>
            </div>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<style scoped>
.ant-table-striped :deep(.ant-table-row-odd) td {
  background-color: #fafafa;
}
.dark .ant-table-striped :deep(.ant-table-row-odd) td {
  background-color: #1f2937;
}
</style>
