<script setup>
import { useRouter } from 'vue-router'
import LucideIcon from '@/components/LucideIcon.vue'
import { useCustomer } from '@/composables/useCustomer'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import ExportExcel from '@/components/ExportExcel.vue'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { ref, watch, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'

const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const {
  loading,
  searchText,
  activeTab,
  customers,
  pagination,
  columns,
  dateRange,
  handleTableChange,
  handleSearch,
  handleStatusChange,
  handleDelete,
  handlePermanentlyDelete,
  refresh,
  handleTabChange,
  handleDateRangeChange,
} = useCustomer()

const canCreate = computed(() => authStore.hasPermission('customer.create'))
const canEdit = computed(() => authStore.hasPermission('customer.edit'))
const canDelete = computed(() => authStore.hasPermission('customer.delete'))

const selectedRowKeys = ref([])
const selectedRows = ref([])

const rowSelection = {
  onChange: (keys, rows) => {
    selectedRowKeys.value = keys
    selectedRows.value = rows
  },
}

const exportColumns = [
  { title: 'FirstName', dataIndex: 'firstname' },
  { title: 'LastName', dataIndex: 'lastname' },
  { title: 'Phone', dataIndex: 'phone' },
  { title: 'Gender', dataIndex: 'gender' },
  { title: 'Wallet Balance', dataIndex: 'wallet_balance' },
  { title: 'Email', dataIndex: 'email' },
  { title: 'Status', dataIndex: 'displayStatus' },
  { title: 'Added On', dataIndex: 'createdAt' },
]

watch(customers, () => {
  selectedRowKeys.value = []
  selectedRows.value = []
})

const handleCreate = () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Creating a new customer is disabled in Demo Mode.',
    })
    return
  }
  if (canCreate.value) {
    router.push({ name: 'customer-create' })
  } else {
    message.error('You do not have permission to create customers')
  }
}

const handleEdit = (record) => {
  if (canEdit.value) {
    router.push({ name: 'customer-edit', params: { id: record.id } })
  } else {
    message.error('You do not have permission to edit customers')
  }
}

const handleView = (record) => {
  router.push({ name: 'customer-view', params: { id: record.id } })
}

const handleWalletHistory = (record) => {
  if (canEdit.value) {
    router.push({ name: 'transaction-histories', query: { id: record.id } })
  } else {
    message.error('You do not have permission to view transaction histories')
  }
}

const handleTransactionHistory = (record) => {
  router.push({ name: 'booking-histories', query: { id: record.id } })
}

const onStatusChange = (val, record) => {
  if (authStore.isDemo) {
    record.status = !val // Revert
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating customer status is disabled in Demo Mode.',
    })
    return
  }
  if (canEdit.value) {
    handleStatusChange(val, record)
  } else {
    message.error('You do not have permission to update customer status')
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
    message.error('You do not have permission to delete customers')
  }
}

const onPermanentlyDeleteConfirm = (record) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Permanent data deletion is disabled in Demo Mode.',
    })
    return
  }
  if (canDelete.value) {
    Modal.confirm({
      title: 'Are you sure you want to permanently delete this customer?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => handlePermanentlyDelete(record),
    })
  } else {
    message.error('You do not have permission to delete customers')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center p-6 rounded-3xl border shadow-sm transition-colors duration-300"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'">
      <div class="flex items-center gap-4">
        <div class="p-3 rounded-2xl transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'">
          <LucideIcon name="Users" :size="24" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'">
            Customer List
          </h1>
          <p class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
            Manage customers
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <ExportExcel :data="selectedRows" :columns="exportColumns" filename="customers-list"
          v-if="selectedRowKeys.length > 0" />
        <a-button type="primary" size="large" class="create-btn bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
          @click="handleCreate">
          <template #icon>
            <LucideIcon name="Plus" :size="18" class="mr-2" />
          </template>
          Create Customer
        </a-button>
      </div>
    </div>

    <!-- Filters & Tabs -->
    <div class="p-6 rounded-3xl border shadow-sm transition-colors duration-300"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div class="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <a-input v-model:value="searchText" placeholder="Search by firstname or phone..."
            class="search-input w-full md:w-80" @input="handleSearch">
            <template #prefix>
              <LucideIcon name="Search" :size="16" class="text-gray-400" />
            </template>
          </a-input>

          <DateRangeFilter v-model:value="dateRange" class="w-full md:w-72" @change="handleDateRangeChange" />
        </div>

        <div class="flex items-center gap-3">
          <a-button class="refresh-btn" @click="refresh" title="Refresh">
            <LucideIcon name="RefreshCw" :size="16" />
          </a-button>
        </div>
      </div>

      <a-tabs v-model:activeKey="activeTab" class="custom-tabs" @change="handleTabChange">
        <a-tab-pane key="all" tab="All Customers" />
        <a-tab-pane key="active" tab="Active" />
        <a-tab-pane key="inactive" tab="Inactive" />
        <a-tab-pane key="deleted" tab="Deleted" />
      </a-tabs>

      <!-- Table -->
      <a-table :columns="columns" :dataSource="customers" :loading="loading" v-model:pagination="pagination"
        :row-selection="rowSelection" @change="handleTableChange" rowKey="id" class="ant-table-striped">
        <!-- Custom Columns -->
        <template #bodyCell="{ column, record }">

          <template v-if="column.key === 'firstname'">
            <div class="flex items-center gap-3">
              <a-avatar :src="record.picture" :size="40"
                class="border border-gray-100 shadow-sm shadow-black/5 shrink-0">
                <template #icon>
                  <LucideIcon name="User" />
                </template>
              </a-avatar>
              <div class="flex flex-col">
                <span class="font-bold text-gray-800 dark:text-gray-100">{{ record.firstname }} {{ record.lastname
                  }}</span>
                <span
                  class="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full w-max mt-0.5">
                  {{ record.email }}
                </span>
              </div>
            </div>
          </template>

          <template v-if="column.key === 'status'">
            <a-switch :checked="record.status" :loading="record.statusLoading" :disabled="!canEdit"
              checked-children="Active" un-checked-children="Inactive" @change="(val) => onStatusChange(val, record)" />
          </template>

          <template v-if="column.key === 'action'">
            <div class="flex justify-end gap-2" v-if="activeTab !== 'deleted'">
              <a-dropdown>
                <a class="ant-dropdown-link" @click.prevent>
                  <LucideIcon name="MoreVertical" :size="20" />
                </a>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="view" @click="handleView(record)">
                      <div class="flex items-center gap-2 text-blue-500">
                        <LucideIcon name="Eye" :size="16" />
                        <span>View</span>
                      </div>
                    </a-menu-item>
                    <a-menu-item key="edit" @click="handleEdit(record)">
                      <div class="flex items-center gap-2 text-amber-500">
                        <LucideIcon name="Edit" :size="16" />
                        <span>Edit</span>
                      </div>
                    </a-menu-item>
                    <a-menu-item key="wallet" @click="handleWalletHistory(record)">
                      <div class="flex items-center gap-2 text-emerald-500">
                        <LucideIcon name="Wallet" :size="16" />
                        <span>Transaction Histories</span>
                      </div>
                    </a-menu-item>
                    <a-menu-item key="transaction" @click="handleTransactionHistory(record)">
                      <div class="flex items-center gap-2 text-indigo-500">
                        <LucideIcon name="ArrowLeftRight" :size="16" />
                        <span>Booking Histories</span>
                      </div>
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="delete">
                      <a-popconfirm v-if="canDelete" title="Are you sure you want to delete this customer?"
                        ok-text="Yes" cancel-text="No" @confirm="onDeleteConfirm(record)">
                        <div class="flex items-center gap-2 text-red-500">
                          <LucideIcon name="Trash2" :size="16" />
                          <span>Delete</span>
                        </div>
                      </a-popconfirm>
                      <div v-else @click="onDeleteConfirm(record)"
                        class="flex items-center gap-2 text-gray-400 cursor-not-allowed px-3 py-1">
                        <LucideIcon name="Trash2" :size="16" />
                        <span>Delete</span>
                      </div>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
            <div class="flex justify-end gap-2" v-else>

              <a-button size="small" type="primary" danger @click="onPermanentlyDeleteConfirm(record)">Permanently
                Delete</a-button>
            </div>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<style scoped></style>
