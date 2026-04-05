<script setup>
import { useRouter } from 'vue-router'
import LucideIcon from '@/components/LucideIcon.vue'
import { useRoute } from '@/composables/useRoute'
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
  routes,
  pagination,
  columns,
  handleTableChange,
  handleSearch,
  handleStatusChange,
  handleDelete,
  refresh,
  handleTabChange,
  handleCopy,
  handleCopyReverse,
} = useRoute()

const canCreate = computed(() => authStore.hasPermission('route.create'))
const canEdit = computed(() => authStore.hasPermission('route.edit'))
const canDelete = computed(() => authStore.hasPermission('route.delete'))

const handleCreate = () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Creating a new route is disabled in Demo Mode.',
    })
    return
  }
  if (canCreate.value) {
    router.push({ name: 'route-create' })
  } else {
    message.error('You do not have permission to create routes')
  }
}

const handleEdit = (record) => {
  if (canEdit.value) {
    router.push({ name: 'route-edit', params: { id: record.id } })
  } else {
    message.error('You do not have permission to edit routes')
  }
}

const onStatusChange = (val, record) => {
  if (authStore.isDemo) {
    record.status = !val // Revert
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating route status is disabled in Demo Mode.',
    })
    return
  }
  if (canEdit.value) {
    handleStatusChange(val, record)
  } else {
    message.error('You do not have permission to update route status')
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
    message.error('You do not have permission to delete routes')
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
            Route List
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Manage routes
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
        Create Route
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
            placeholder="Search by title..."
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
        <a-tab-pane key="all" tab="All Routes" />
        <a-tab-pane key="active" tab="Active" />
        <a-tab-pane key="inactive" tab="Inactive" />
      </a-tabs>

      <!-- Table -->
      <a-table
        :columns="columns"
        :dataSource="routes"
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

              <a-tooltip :title="canCreate ? 'Copy Route' : 'No Permission to Copy'">
                <a-popconfirm
                  v-if="canCreate"
                  title="Are you sure you want to duplicate this route?"
                  ok-text="Yes"
                  cancel-text="No"
                  @confirm="handleCopy(record)"
                >
                  <a-button type="text" class="text-blue-500 hover:bg-blue-50 rounded-lg p-2">
                    <LucideIcon name="Copy" class="text-blue-500" :size="16" />
                  </a-button>
                </a-popconfirm>
                <a-button v-else type="text" class="rounded-lg p-2" @click="handleCopy(record)">
                  <LucideIcon name="Copy" class="text-gray-400" :size="16" />
                </a-button>
              </a-tooltip>

              <a-tooltip :title="canEdit ? 'Reverse Stops' : 'No Permission to Edit'">
                <a-popconfirm
                  v-if="canEdit"
                  title="Are you sure you want to reverse the order of the stops for this route?"
                  ok-text="Yes"
                  cancel-text="No"
                  @confirm="handleCopyReverse(record)"
                >
                  <a-button type="text" class="text-green-500 hover:bg-green-50 rounded-lg p-2">
                    <LucideIcon name="ArrowRightLeft" class="text-green-500" :size="16" />
                  </a-button>
                </a-popconfirm>
                <a-button v-else type="text" class="rounded-lg p-2" @click="handleCopyReverse(record)">
                  <LucideIcon name="ArrowRightLeft" class="text-gray-400" :size="16" />
                </a-button>
              </a-tooltip>
              
              <a-tooltip :title="canDelete ? 'Delete' : 'No Permission to Delete'">
                <a-popconfirm
                  v-if="canDelete"
                  title="Are you sure you want to delete this route?"
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
