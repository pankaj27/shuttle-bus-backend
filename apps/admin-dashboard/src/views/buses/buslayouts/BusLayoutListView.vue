<template>
  <div class="space-y-6">
    <!-- Header -->

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
          <LucideIcon name="Layout" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Bus Layout List
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Manage bus layouts
          </p>
        </div>
      </div>
      <a-button
        type="primary"
        size="large"
        class="create-btn bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
        @click="openDrawer()"
      >
        <template #icon><LucideIcon name="Plus" :size="18" class="mr-2" /></template>
        Create Bus Layout
      </a-button>
    </div>

    <!-- Table Card -->
    <a-card :bordered="false" class="shadow-sm">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div class="w-full md:w-auto">
          <a-input
            v-model:value="searchText"
            placeholder="Search by name or max seats..."
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
        <a-tab-pane key="all" tab="All Layouts" />
        <a-tab-pane key="active" tab="Active" />
        <a-tab-pane key="inactive" tab="Inactive" />
      </a-tabs>
      <a-table
        :columns="columns"
        :data-source="buslayout"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-switch
              v-model:checked="record.status"
              :loading="record.statusLoading"
              :disabled="!canEdit"
              @change="(val) => onStatusChange(val, record)"
            />
          </template>

          <template v-if="column.key === 'action'">
            <div class="flex gap-2">
              <a-tooltip :title="canEdit ? 'Edit' : 'No Permission to Edit'">
                <a-button type="text" @click="openDrawer(record)">
                  <template #icon
                    ><LucideIcon name="Pencil" :size="16" :class="canEdit ? 'text-blue-500' : 'text-gray-300'"
                  /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="canDelete ? 'Delete' : 'No Permission to Delete'">
                <a-popconfirm
                  v-if="canDelete"
                  title="Are you sure delete this bus layout?"
                  @confirm="onDeleteConfirm(record.id)"
                >
                  <a-button type="text">
                    <template #icon
                      ><LucideIcon name="Trash2" :size="16" class="text-red-500"
                    /></template>
                  </a-button>
                </a-popconfirm>
                <a-button v-else type="text" @click="onDeleteConfirm(record.id)">
                   <template #icon
                      ><LucideIcon name="Trash2" :size="16" class="text-gray-300"
                    /></template>
                </a-button>
              </a-tooltip>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- CRUD Drawer -->
    <a-drawer
      v-model:open="drawerVisible"
      :title="isEdit ? 'Edit Bus Layout' : 'Add New Bus Layout'"
      placement="right"
      width="800"
      :closable="true"
      @close="closeDrawer"
    >
      <template #extra>
        <a-space>
          <a-button @click="closeDrawer">Cancel</a-button>
          <a-button type="primary" :loading="submitLoading" :disabled="authStore.isDemo" @click="() => layoutFormRef?.submit()">
            {{ isEdit ? 'Update' : 'Create' }}
          </a-button>
        </a-space>
      </template>

      <!-- Demo Mode Alert -->
      <a-alert
        v-if="authStore.isDemo"
        message="Demo Mode Active"
        description="Bus layout details can be viewed but modifications are disabled."
        type="warning"
        show-icon
        class="mb-6 rounded-xl"
      />

      <BusLayoutForm
        :ref="(el) => (layoutFormRef = el)"
        :key="editingId || 'new'"
        :record="selectedRecord"
        :is-edit="isEdit"
        :loading="submitLoading"
        :disabled="authStore.isDemo"
        @submit="handleSubmit"
        @cancel="closeDrawer"
      />
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBusLayout } from '@/composables/useBusLayout'
import { buslayoutService } from '@/services/buslayout.service'
import { message, Modal } from 'ant-design-vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { useThemeStore } from '@/stores/theme'
import BusLayoutForm from './components/BusLayoutForm.vue'

const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const {
  loading,
  searchText,
  activeTab, 
  buslayout,
  pagination,
  columns,
  handleTableChange,
  handleSearch,
  handleTabChange,
  handleStatusChange,
  handleDelete,
  refresh,
} = useBusLayout()

const canCreate = computed(() => authStore.hasPermission('bus.layout.create'))
const canEdit = computed(() => authStore.hasPermission('bus.layout.edit'))
const canDelete = computed(() => authStore.hasPermission('bus.layout.delete'))

// Drawer State
const drawerVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const editingId = ref(null)
const selectedRecord = ref(null)
const layoutFormRef = ref(null)

const openDrawer = (record = null) => {
  console.log('Opening Drawer - Record:', record)
  if (record) {
    if (!canEdit.value) {
      message.error('You do not have permission to edit bus layouts')
      return;
    }
    isEdit.value = true
    editingId.value = record.id || record.ids || record._id
    selectedRecord.value = { ...record }
    console.log('Edit Mode - ID:', editingId.value, 'Record:', selectedRecord.value)
  } else {
    if (authStore.isDemo) {
      Modal.warning({
        title: 'Action Restricted',
        content: 'Creating a new bus layout is disabled in Demo Mode.',
      })
      return
    }
    if (!canCreate.value) {
      message.error('You do not have permission to create bus layouts')
      return;
    }
    isEdit.value = false
    editingId.value = null
    selectedRecord.value = null
    console.log('Create Mode')
  }
  drawerVisible.value = true
}

const onStatusChange = (val, record) => {
  if (authStore.isDemo) {
    record.status = !val // Revert
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating bus layout status is disabled in Demo Mode.',
    })
    return
  }
  if (canEdit.value) {
    handleStatusChange(val, record)
  } else {
    message.error('You do not have permission to update bus layout status')
  }
}

const onDeleteConfirm = (id) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Data deletion is disabled in Demo Mode.',
    })
    return
  }
  if (canDelete.value) {
    handleDelete(id)
  } else {
    message.error('You do not have permission to delete bus layouts')
  }
}

const closeDrawer = () => {
  drawerVisible.value = false
  selectedRecord.value = null
}

const handleSubmit = async (formData) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating bus layout details is disabled in Demo Mode.',
    });
    return;
  }
  try {
    submitLoading.value = true

    if (isEdit.value) {
      await buslayoutService.update(editingId.value, formData)
      message.success('Bus Layout updated successfully')
    } else {
      await buslayoutService.create(formData)
      message.success('Bus Layout created successfully')
    }

    closeDrawer()
    refresh()
  } catch (error) {
    console.error(error)
    message.error(error.response?.data?.message || 'Something went wrong')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
@reference "tailwindcss";

:deep(.ant-table-thead > tr > th) {
  @apply bg-gray-50/50;
}
</style>
