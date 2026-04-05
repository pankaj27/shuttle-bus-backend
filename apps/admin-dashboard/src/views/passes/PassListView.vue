<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import LucideIcon from '@/components/LucideIcon.vue'
import { usePass } from '@/composables/usePass'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { message, Modal } from 'ant-design-vue'

const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const {
  loading,
  searchText,
  filterStatus,
  activeTab, // destructure activeTab
  pass,
  pagination,
  columns,
  handleTableChange,
  handleSearch,
  handleStatusChange,
  handleDelete,
  refresh,
  handleTabChange,
} = usePass()

const canCreate = computed(() => authStore.hasPermission('pass.create'))
const canEdit = computed(() => authStore.hasPermission('pass.edit'))
const canDelete = computed(() => authStore.hasPermission('pass.delete'))

const handleCreate = () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Creating a new pass is disabled in Demo Mode.',
    })
    return
  }
  if (canCreate.value) {
    router.push({ name: 'pass-create' })
  } else {
    message.error('You do not have permission to create passes')
  }
}

const handleEdit = (record) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Editing pass details is disabled in Demo Mode.',
    })
    return
  }
  if (canEdit.value) {
    router.push(`/passes/edit/${record.id}`)
  } else {
    message.error('You do not have permission to edit passes')
  }
}

const onStatusChange = (val, record) => {
  if (authStore.isDemo) {
    record.status = !val // Revert
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating pass status is disabled in Demo Mode.',
    })
    return
  }
  if (canEdit.value) {
    handleStatusChange(val, record)
  } else {
    message.error('You do not have permission to update pass status')
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
    message.error('You do not have permission to delete passes')
  }
}
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
          <LucideIcon name="Ticket" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Passs List
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Manage discount coupons and promotional passs
          </p>
        </div>
      </div>
      <a-button
        type="primary"
        size="large"
        class="create-btn bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
        @click="handleCreate"
      >
        <template #icon><LucideIcon name="Plus" :size="18" class="mr-2" /></template>
        Create Pass
      </a-button>
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
            placeholder="Search by no of ride or valid days..."
            class="search-input w-full md:w-80"
            @change="handleSearch"
          >
            <template #prefix>
              <LucideIcon name="Search" :size="16" class="text-gray-400" />
            </template>
          </a-input>
        </div>

        <div class="flex items-center gap-3">
          <!-- <a-select
            v-model:value="filterStatus"
            placeholder="Filter by Status"
            class="w-40 rounded-xl"
            allowClear
            @change="handleSearch"
          >
            <a-select-option value="true">Active</a-select-option>
            <a-select-option value="false">Inactive</a-select-option>
          </a-select> -->
          <a-button class="refresh-btn" @click="refresh">
            <LucideIcon name="RefreshCw" :size="16" />
          </a-button>
        </div>
      </div>

      <a-tabs v-model:activeKey="activeTab" class="custom-tabs" @change="handleTabChange">
        <a-tab-pane key="all" tab="All Passs" />
        <a-tab-pane key="active" tab="Active" />
        <a-tab-pane key="inactive" tab="Inactive" />
      </a-tabs>

      <!-- Table -->
      <a-table
        :columns="columns"
        :dataSource="pass"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        rowKey="id"
        class="ant-table-striped"
      >
        <!-- Custom Columns -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="font-bold" :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-800'">
              {{ record.name }}
            </div>
          </template>

          <template v-if="column.key === 'code'">
            <a-tag color="blue" class="font-mono font-bold">{{ record.code }}</a-tag>
          </template>

          <template v-if="column.key === 'discount'">
            <span class="font-bold text-green-600"> {{ record.discount }} % </span>
          </template>

          <template v-if="column.key === 'status'">
            <a-switch
              :checked="record.status"
              :loading="record.statusLoading"
              :disabled="!canEdit"
              checked-children="Active"
              un-checked-children="Inactive"
              @change="(val) => onStatusChange(val, record)"
            />
          </template>

          <template v-if="column.key === 'action'">
            <div class="flex justify-end gap-2">
              <a-tooltip :title="canEdit ? 'Edit' : 'No Permission to Edit'">
                <a-button
                  type="text"
                  class="rounded-lg p-2"
                  @click="handleEdit(record)"
                >
                  <LucideIcon name="Edit" :class="canEdit ? 'text-blue-500' : 'text-gray-300'" :size="16" />
                </a-button>
              </a-tooltip>
              
              <a-tooltip :title="canDelete ? 'Delete' : 'No Permission to Delete'">
                <a-popconfirm
                 v-if="canDelete"
                  title="Are you sure delete this pass?"
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

<style scoped></style>
