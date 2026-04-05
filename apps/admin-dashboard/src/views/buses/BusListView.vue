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
          <LucideIcon name="Bus" :size="24" />
        </div>
        <div>
          <h1   
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Bus List
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Manage buses
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
        Add Bus
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
        <a-tab-pane key="all" tab="All Buses" />
        <a-tab-pane key="Active" tab="Active" />
        <a-tab-pane key="OnRoute" tab="OnRoute" />
        <a-tab-pane key="Idle" tab="Idle" />
        <a-tab-pane key="Maintance" tab="Maintance" />
        <a-tab-pane key="Breakdown" tab="Breakdown" />
        <a-tab-pane key="Inactive" tab="Inactive" />
      </a-tabs>

      <a-table
        :columns="columns"
        :data-source="bus"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'layout'">
                {{ record.layout }}

              </template>
          <template v-if="column.key === 'status'">
            <a-select
              v-model:value="record.status"
              size="small"
              :bordered="false"
              class="status-select w-32 font-bold"
              :loading="record.statusLoading"
              :disabled="!canEdit"
              @change="(val) => onStatusChange(val, record)"
              :dropdown-match-select-width="false"
            >
              <a-select-option value="Active">
                <a-tag color="success" class="m-0 rounded-full px-3">Active</a-tag>
              </a-select-option>
              <a-select-option value="OnRoute">
                <a-tag color="processing" class="m-0 rounded-full px-3">OnRoute</a-tag>
              </a-select-option>
              <a-select-option value="Idle">
                <a-tag color="warning" class="m-0 rounded-full px-3">Idle</a-tag>
              </a-select-option>
              <a-select-option value="Maintance">
                <a-tag color="default" class="m-0 rounded-full px-3">Maintance</a-tag>
              </a-select-option>
              <a-select-option value="Breakdown">
                <a-tag color="error" class="m-0 rounded-full px-3">Breakdown</a-tag>
              </a-select-option>
              <a-select-option value="Inactive">
                <a-tag color="error" class="m-0 rounded-full px-3">Inactive</a-tag>
              </a-select-option>
            </a-select>
          </template>

          <template v-if="column.key === 'action'">
            <div class="flex gap-2">
              <a-tooltip :title="canEdit ? 'Edit' : 'No Permission to Edit'">
                <a-button type="text" @click="openDrawer(record)">
                  <template #icon><LucideIcon name="Pencil" :size="16" :class="canEdit ? 'text-blue-500' : 'text-gray-300'" /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="canDelete ? 'Delete' : 'No Permission to Delete'">
                <a-popconfirm
                  v-if="canDelete"
                  title="Are you sure delete this bus?"
                  @confirm="onDeleteConfirm(record.id)"
                >
                  <a-button type="text">
                    <template #icon><LucideIcon name="Trash2" :size="16" class="text-red-500" /></template>
                  </a-button>
                </a-popconfirm>
                <a-button v-else type="text" @click="onDeleteConfirm(record.id)">
                  <template #icon><LucideIcon name="Trash2" :size="16" class="text-gray-300" /></template>
                </a-button>
              </a-tooltip>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- CRUD Drawer -->
    <!-- CRUD Drawer -->
    <a-drawer
      v-model:open="drawerVisible"
      :title="isEdit ? 'Edit Bus' : 'Add New Bus'"
      placement="right"
      width="720"
      :closable="true"
      @close="closeDrawer"
      :maskClosable="false"
    >
      <template #extra>
        <div class="flex gap-2">
          <a-button @click="closeDrawer">Cancel</a-button>
          <a-button type="primary" :loading="submitLoading" :disabled="authStore.isDemo" @click="busFormRef?.submit()">
            {{ isEdit ? 'Update' : 'Save' }}
          </a-button>
        </div>
      </template>

      <!-- Demo Mode Alert -->
      <a-alert
        v-if="authStore.isDemo"
        message="Demo Mode Active"
        description="Bus details can be viewed but modifications are disabled."
        type="warning"
        show-icon
        class="mb-6 rounded-xl"
      />

      <BusForm
        v-if="drawerVisible"
        ref="busFormRef"
        :record="selectedRecord"
        :is-edit="isEdit"
        :loading="submitLoading"
        :disabled="authStore.isDemo"
        @submit="handleSubmit"
      />
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBus } from '@/composables/useBus';
import { busService } from '@/services/bus.service';
import { message, Modal } from 'ant-design-vue';
import LucideIcon from "@/components/LucideIcon.vue"
import { useThemeStore } from '@/stores/theme'
import BusForm from './components/BusForm.vue'

const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const {
  loading,
  searchText,
  activeTab, 
  bus,
  pagination,
  columns,
  handleTableChange,
  handleSearch,
  handleTabChange,
  handleStatusChange,
  handleDelete,
  refresh,
} = useBus();

const canCreate = computed(() => authStore.hasPermission('bus.create'))
const canEdit = computed(() => authStore.hasPermission('bus.edit'))
const canDelete = computed(() => authStore.hasPermission('bus.delete'))

// Drawer State
const drawerVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const editingId = ref(null);
const selectedRecord = ref(null);
const busFormRef = ref(null);

const openDrawer = (record = null) => {
  if (record) {
    if (!canEdit.value) {
      message.error('You do not have permission to edit buses')
      return;
    }
    isEdit.value = true;
    editingId.value = record.is || record.id || record._id; // Handle varied ID formats
    selectedRecord.value = { ...record };
  } else {
    if (authStore.isDemo) {
      Modal.warning({
        title: 'Action Restricted',
        content: 'Adding a new bus is disabled in Demo Mode.',
      });
      return;
    }
    if (!canCreate.value) {
      message.error('You do not have permission to add buses')
      return;
    }
    isEdit.value = false;
    editingId.value = null;
    selectedRecord.value = null;
  }
  drawerVisible.value = true;
};

const onStatusChange = (val, record) => {
  if (authStore.isDemo) {
    // We cannot easily revert reactive object in a select easily without a copy, 
    // but the backend will block it. For UX, we can just show warning and the select will stay.
    // Better: refresh or warn.
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating bus status is disabled in Demo Mode.',
    })
    refresh() // Revert UI
    return
  }
  if (canEdit.value) {
    handleStatusChange(val, record)
  } else {
    message.error('You do not have permission to update bus status')
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
    message.error('You do not have permission to delete buses')
  }
}

const closeDrawer = () => {
  drawerVisible.value = false;
  selectedRecord.value = null;
};

const handleSubmit = async (formData) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating bus details is disabled in Demo Mode.',
    });
    return;
  }
  try {
    submitLoading.value = true;
    
    if (isEdit.value) {
      await busService.update(editingId.value, formData);
      message.success('Bus updated successfully');
    } else {
      await busService.create(formData);
      message.success('Bus created successfully');
    }
    
    closeDrawer();
    refresh();
  } catch (error) {
    console.error(error);
    message.error(error.response?.data?.message || 'Operation failed');
  } finally {
    submitLoading.value = false;
  }
};
</script>

<style scoped>
@reference "tailwindcss";

:deep(.ant-table-thead > tr > th) {
  @apply bg-gray-50/50;
}
</style>
