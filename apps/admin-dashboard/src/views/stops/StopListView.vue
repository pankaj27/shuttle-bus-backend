<script setup>
import { useRouter } from 'vue-router'
import LucideIcon from '@/components/LucideIcon.vue'
import { useStop } from '@/composables/useStop'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'
import { message, Modal } from 'ant-design-vue'

const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const {
  loading,
  searchText,
  activeTab,
  stops,
  pagination,
  columns,
  handleTableChange,
  handleSearch,
  handleStatusChange,
  handleDelete,
  refresh,
  handleTabChange,
} = useStop()

const canCreate = computed(() => authStore.hasPermission('stop.create'))
const canEdit = computed(() => authStore.hasPermission('stop.edit'))
const canDelete = computed(() => authStore.hasPermission('stop.delete'))

const handleCreate = () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Creating a new stop is disabled in Demo Mode.',
    })
    return
  }
  if (canCreate.value) {
    router.push({ name: 'stop-create' })
  } else {
    message.error('You do not have permission to create stops')
  }
}

const handleEdit = (record) => {
  if (canEdit.value) {
    router.push({ name: 'stop-edit', params: { id: record.id } })
  } else {
    message.error('You do not have permission to edit stops')
  }
}

const onStatusChange = (val, record) => {
  if (authStore.isDemo) {
    record.status = !val // Revert
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating stop status is disabled in Demo Mode.',
    })
    return
  }
  if (canEdit.value) {
    handleStatusChange(val, record)
  } else {
    message.error('You do not have permission to update stop status')
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
    message.error('You do not have permission to delete stops')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex justify-between items-center p-6 border shadow-sm transition-colors duration-300"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
      :style="{ borderRadius: 'var(--radius-premium)' }"
    >
      <div class="flex items-center gap-4">
        <div
          class="p-3 rounded-2xl transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'"
        >
          <LucideIcon name="LocateFixed" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Stop List
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Manage bus stops and locations
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
        Create Stop
      </a-button>
    </div>

    <!-- Filters & Tabs -->
    <div
      class="p-6 border shadow-sm transition-colors duration-300"
      :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
      :style="{ borderRadius: 'var(--radius-premium)' }"
    >
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div class="w-full md:w-auto">
          <a-input
            v-model:value="searchText"
            placeholder="Search by title or landmark..."
            class="search-input w-full md:w-80"
            @change="handleSearch"
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
        <a-tab-pane key="all" tab="All Stops" />
        <a-tab-pane key="active" tab="Active" />
        <a-tab-pane key="inactive" tab="Inactive" />
      </a-tabs>

      <!-- Table -->
      <a-table
        :columns="columns"
        :dataSource="stops"
        :loading="loading"
        v-model:pagination="pagination"
        @change="handleTableChange"
        rowKey="id"
        class="ant-table-striped"
      >
        <!-- Custom Columns -->
        <template #bodyCell="{ column, record }">
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
                  <LucideIcon name="Edit" :class="canEdit ? 'text-blue-500' : 'text-gray-400'" :size="16" />
                </a-button>
              </a-tooltip>
              
              <a-tooltip :title="canDelete ? 'Delete' : 'No Permission to Delete'">
                <a-popconfirm
                  v-if="canDelete"
                  title="Are you sure you want to delete this stop?"
                  ok-text="Yes"
                  cancel-text="No"
                  @confirm="onDeleteConfirm(record)"
                >
                  <a-button type="text" class="text-red-500 hover:bg-red-50 rounded-lg p-2">
                    <LucideIcon name="Trash2" class="text-red-500" :size="16" />
                  </a-button>
                </a-popconfirm>
                <a-button v-else type="text" class="rounded-lg p-2" @click="onDeleteConfirm(record)">
                  <LucideIcon name="Trash2" class="text-gray-400" :size="16" />
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
