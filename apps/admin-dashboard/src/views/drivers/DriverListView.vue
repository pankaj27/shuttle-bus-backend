<template>
  <div class="driver-list">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Drivers Management</h2>
        <p class="text-gray-500 text-sm">View and manage all shuttle drivers and assistants.</p>
      </div>
      <div class="flex items-center gap-3">
        <ExportExcel 
          :data="selectedRows" 
          :columns="exportColumns" 
          filename="drivers-list"
          v-if="selectedRowKeys.length > 0"
        />
        <a-button 
          type="primary" 
          @click="handleAddClick" 
          class="flex items-center rounded-xl bg-blue-600 border-none shadow-lg shadow-blue-100 h-10"
        >
          <LucideIcon name="UserPlus" :size="18" class="mr-2" />
          Add New Driver
        </a-button>
      </div>
    </div>

    <a-card :bordered="false" class="shadow-sm overflow-hidden" :style="{ borderRadius: 'var(--radius-premium)' }">
      <div class="mb-6 flex flex-wrap gap-4 items-center">
        <a-input
          v-model:value="searchText"
          placeholder="Search name, email or phone..."
          class="w-full md:w-80 rounded-xl"
          @input="handleSearch"
        >
          <template #prefix>
            <LucideIcon name="Search" :size="16" class="text-gray-400" />
          </template>
        </a-input>

        <a-select
          v-model:value="filterStatus"
          placeholder="Status"
          class="w-full md:w-40"
          :dropdown-style="{ borderRadius: '12px' }"
          allow-clear
          @change="handleSearch"
        >
          <a-select-option value="true">Active</a-select-option>
          <a-select-option value="false">Inactive</a-select-option>
        </a-select>

        <DateRangeFilter
          v-model:value="dateRange"
          class="w-full md:w-80  mr-2"
          @change="handleDateRangeChange"
        />

        <a-button @click="refresh" :loading="loading" >
          <LucideIcon name="RotateCcw" :size="18" />
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="drivers"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="flex items-center gap-3">
              <a-avatar :src="record.picture" :size="40">
                <template #icon><LucideIcon name="User" :size="20" /></template>
              </a-avatar>
              <div class="flex flex-col">
                <span class="font-semibold text-gray-800">{{ record.name }}</span>
                <span class="text-xs text-gray-400 capitalize">{{ record.type }}</span>
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
            <div class="flex gap-2">
              <a-tooltip :title="canEdit ? 'Edit' : 'No Permission to Edit'">
                <a-button type="text" @click="handleEditClick(record)">
                  <template #icon><LucideIcon name="Pencil" :size="16" :class="canEdit ? 'text-blue-500' : 'text-gray-400'" /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="canDelete ? 'Delete' : 'No Permission to Delete'">
                <a-popconfirm
                  v-if="canDelete"
                  title="Are you sure delete this driver?"
                  @confirm="onDeleteConfirm(record)"
                >
                  <a-button type="text">
                    <template #icon><LucideIcon name="Trash2" :size="16" class="text-red-500" /></template>
                  </a-button>
                </a-popconfirm>
                <a-button v-else type="text" @click="onDeleteConfirm(record)">
                  <template #icon><LucideIcon name="Trash2" :size="16" class="text-gray-400" /></template>
                </a-button>
              </a-tooltip>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { useDrivers } from '@/composables/useDrivers';
import DateRangeFilter from '@/components/DateRangeFilter.vue';
import LucideIcon from '@/components/LucideIcon.vue';
import ExportExcel from '@/components/ExportExcel.vue';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { ref, watch,computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { useRouter } from 'vue-router';

const themeStore = useThemeStore();
const authStore = useAuthStore();
const router = useRouter();

const {
  loading,
  searchText,
  filterStatus,
  dateRange,
  drivers,
  pagination,
  columns,
  handleTableChange,
  handleSearch,
  handleDateRangeChange,
  handleStatusChange,
  handleDelete,
  refresh
} = useDrivers();

const canCreate = computed(() => authStore.hasPermission('driver.create'));
const canEdit = computed(() => authStore.hasPermission('driver.edit'));
const canDelete = computed(() => authStore.hasPermission('driver.delete'));

const handleAddClick = () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Adding a new driver is disabled in Demo Mode.',
    });
    return;
  }
  if (canCreate.value) {
    router.push({ name: 'driver-create' });
  } else {
    message.error('You do not have permission to create drivers');
  }
};

const handleEditClick = (record) => {
  if (canEdit.value) {
    router.push({ name: 'driver-edit', params: { id: record.id } });
  } else {
    message.error('You do not have permission to edit drivers');
  }
};

const onStatusChange = (val, record) => {
  if (authStore.isDemo) {
    record.status = !val; // Revert
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating driver status is disabled in Demo Mode.',
    });
    return;
  }
  if (canEdit.value) {
    handleStatusChange(val, record);
  } else {
    // Revert the switch status
    record.status = !val;
    message.error('You do not have permission to update driver status');
  }
};

const onDeleteConfirm = (record) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Data deletion is disabled in Demo Mode to maintain a consistent experience for all users.',
    });
    return;
  }
  if (canDelete.value) {
    handleDelete(record);
  } else {
    message.error('You do not have permission to delete drivers');
  }
};

const selectedRowKeys = ref([])
const selectedRows = ref([])

const rowSelection = {
  onChange: (keys, rows) => {
    selectedRowKeys.value = keys
    selectedRows.value = rows
  }
}

const exportColumns = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Email', dataIndex: 'email' },
  { title: 'Phone', dataIndex: 'phone' },
  { title: 'Type', dataIndex: 'type' },
  { title: 'Status', dataIndex: 'status' },
  { title: 'Added On', dataIndex: 'createdAt' },
]

watch(drivers, () => {
  selectedRowKeys.value = []
  selectedRows.value = []
})
</script>

<style scoped>
@reference "tailwindcss";

:deep(.ant-table-thead > tr > th) {
  @apply bg-gray-50/50;
}
</style>
