<script setup>
import { useRouter } from 'vue-router'
import { useUser } from '@/composables/useUser'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import LucideIcon from '@/components/LucideIcon.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import ExportExcel from '@/components/ExportExcel.vue'
import { ref, watch, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'

const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const {
  loading,
  searchText,
  filterStatus,
  dateRange,
  users,
  pagination,
  columns,
  handleTableChange,
  handleSearch,
  handleDateRangeChange,
  handleStatusChange,
  handleDelete,
  refresh,
} = useUser()

const canCreate = computed(() => authStore.hasPermission('user.create'))
const canEdit = computed(() => authStore.hasPermission('user.edit'))
const canDelete = computed(() => authStore.hasPermission('user.delete'))

const selectedRowKeys = ref([])
const selectedRows = ref([])

const rowSelection = {
  onChange: (keys, rows) => {
    selectedRowKeys.value = keys
    selectedRows.value = rows
  },
}

const exportColumns = [
  { title: 'First Name', dataIndex: 'firstname' },
  { title: 'Last Name', dataIndex: 'lastname' },
  { title: 'Email', dataIndex: 'email' },
  { title: 'Phone', dataIndex: 'phone' },
  { title: 'Role', dataIndex: 'role' },
  { title: 'Status', dataIndex: 'displayStatus' },
  { title: 'Created At', dataIndex: 'createdAt' },
]

watch(users, () => {
  selectedRowKeys.value = []
  selectedRows.value = []
})

const navigateToCreate = () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Creating a new user is disabled in Demo Mode.',
    })
    return
  }
  if (canCreate.value) {
    router.push({ name: 'users-create' })
  } else {
    message.error('You do not have permission to create users')
  }
}

const navigateToEdit = (id) => {
  if (canEdit.value) {
    router.push({ name: 'users-edit', params: { id } })
  } else {
    message.error('You do not have permission to edit users')
  }
}

const onStatusChange = (val, record) => {
  if (authStore.isDemo) {
    record.status = !val // Revert
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating user status is disabled in Demo Mode.',
    })
    return
  }
  if (canEdit.value) {
    handleStatusChange(val, record)
  } else {
    message.error('You do not have permission to update user status')
  }
}

const onDeleteConfirm = (record) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Data deletion is disabled in Demo Mode.',
    })
    return
  }
  if (canDelete.value) {
    handleDelete(record)
  } else {
    message.error('You do not have permission to delete users')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-3xl border shadow-sm transition-all duration-300 backdrop-blur-sm gap-4"
      :class="themeStore.isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-100'"
    >
      <div class="flex items-center gap-4">
        <div
          class="p-3 rounded-2xl transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'"
        >
          <LucideIcon name="Users" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Manage Users
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Manage your administrators and users
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <ExportExcel
          :data="selectedRows"
          :columns="exportColumns"
          filename="users-list"
          v-if="selectedRowKeys.length > 0"
        />
        <a-button
          type="primary"
          size="large"
          class="create-btn bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
          @click="navigateToCreate"
        >
          <template #icon><LucideIcon name="Plus" :size="18" class="mr-2" /></template>
          Add User
        </a-button>
      </div>
    </div>

    <!-- Filters & Table -->
    <a-card :bordered="false" class="shadow-sm rounded-3xl overflow-hidden" :class="{ 'dark-card': themeStore.isDark }">
      <!-- Search & Filters -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div class="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <a-input
            v-model:value="searchText"
            placeholder="Search by name, email or phone..."
            class="search-input w-full md:w-80 h-11 rounded-xl"
            @input="handleSearch"
          >
            <template #prefix>
              <LucideIcon name="Search" :size="18" class="text-gray-400" />
            </template>
          </a-input>

          <a-select 
            v-model:value="filterStatus" 
            placeholder="Filter Status" 
            class="w-full md:w-40 h-11"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option value="true">Active</a-select-option>
            <a-select-option value="false">Inactive</a-select-option>
          </a-select>

          <DateRangeFilter
            v-model:value="dateRange"
            @change="handleDateRangeChange"
            class="w-full md:w-auto"
          />
        </div>

        <div class="flex items-center gap-3">
          <a-button class="refresh-btn h-11 w-11 flex items-center justify-center rounded-xl" @click="refresh" title="Refresh">
            <LucideIcon name="RefreshCw" :size="18" :class="{ 'animate-spin': loading }" />
          </a-button>
        </div>
      </div>

      <!-- Table -->
      <a-table
        :columns="columns"
        :data-source="users"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        @change="handleTableChange"
        rowKey="id"
        class="user-table shadow-sm rounded-2xl"
      >
        <!-- Custom Body Cells -->
        <template #bodyCell="{ column, record }">
          <!-- Name/User Cell -->
          <template v-if="column.key === 'name'">
            <div class="flex items-center gap-3">
              <a-avatar :src="record.profile_picture" :size="40" class="border border-gray-100 shadow-sm shadow-black/5 shrink-0">
                <template #icon><LucideIcon name="User" /></template>
              </a-avatar>
              <div class="flex flex-col">
                <span class="font-bold text-gray-800 dark:text-gray-100">{{ record.firstname }} {{ record.lastname }}</span>
                <span class="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full w-max mt-0.5">
                  {{ record.role || 'Staff' }}
                </span>
              </div>
            </div>
          </template>

          <template v-if="column.key === 'status'">
            <a-switch
              v-model:checked="record.status"
              :loading="record.statusLoading"
              :disabled="!canEdit"
              @change="(val) => onStatusChange(val, record)"
            />
          </template>

          <template v-if="column.key === 'action'">
            <div class="flex gap-2 justify-end">
              <a-tooltip :title="canEdit ? 'Edit User' : 'No Permission to Edit'">
                <a-button 
                  type="text" 
                  :class="canEdit ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-gray-400'" 
                  @click="navigateToEdit(record.id)"
                >
                  <template #icon><LucideIcon name="Pencil" :size="16" /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="canDelete ? 'Delete User' : 'No Permission to Delete'">
                <a-popconfirm
                  v-if="canDelete"
                  title="Are you sure you want to delete this user?"
                  @confirm="onDeleteConfirm(record)"
                  ok-text="Yes, Delete"
                  cancel-text="No"
                  ok-type="danger"
                >
                  <a-button type="text" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <template #icon><LucideIcon name="Trash2" :size="16" /></template>
                  </a-button>
                </a-popconfirm>
                <a-button v-else type="text" class="text-gray-400" @click="onDeleteConfirm(record)">
                  <template #icon><LucideIcon name="Trash2" :size="16" /></template>
                </a-button>
              </a-tooltip>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

:deep(.ant-card-body) {
  padding: 24px;
}

.user-table :deep(.ant-table-thead > tr > th) {
  @apply bg-gray-50/50 font-bold text-gray-600;
  border-bottom: 2px solid #f0f0f0;
}

.dark .user-table :deep(.ant-table-thead > tr > th) {
  background-color: rgba(31, 41, 55, 0.5) !important;
  color: #9ca3af !important;
  border-bottom-color: #374151 !important;
}

.user-table :deep(.ant-table-row:hover) {
  @apply transition-colors duration-200 cursor-default;
}

.dark-card {
  @apply bg-gray-800! text-white!;
}

:deep(.ant-select-selector) {
  @apply rounded-xl! h-11! flex items-center!;
}
</style>