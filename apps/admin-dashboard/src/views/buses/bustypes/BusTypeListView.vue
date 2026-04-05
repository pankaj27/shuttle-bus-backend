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
          <LucideIcon name="Tag" :size="24" />
        </div>
        <div>
          <h1   
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Bus Type List
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Manage bus types
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
        Create Bus Type
      </a-button>
    </div>

    <!-- Table Card -->
    <a-card :bordered="false" class="shadow-sm">
      <div class="mb-4 flex flex-wrap gap-4 items-center">
        <a-input-search
          v-model:value="searchText"
          placeholder="Search bus type name..."
          style="width: 300px"
          @search="handleSearch"
          @input="handleSearch"
        />
        <a-button @click="refresh" :loading="loading" class="flex items-center justify-center">
          <LucideIcon name="RotateCcw" :size="18" />
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="bustype"
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
                  <template #icon><LucideIcon name="Pencil" :size="16" :class="canEdit ? 'text-blue-500' : 'text-gray-300'" /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="canDelete ? 'Delete' : 'No Permission to Delete'">
                <a-popconfirm
                  v-if="canDelete"
                  title="Are you sure delete this bus type?"
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

    <a-drawer
      v-model:open="drawerVisible"
      :title="isEdit ? 'Edit Bus Type' : 'Add New Bus Type'"
      placement="right"
      width="400"
      :closable="true"
      @close="closeDrawer"
    >
      <template #extra>
        <a-space>
          <a-button @click="closeDrawer">Cancel</a-button>
          <a-button type="primary" :loading="submitLoading" :disabled="authStore.isDemo" @click="handleSubmit">
            {{ isEdit ? 'Update' : 'Create' }}
          </a-button>
        </a-space>
      </template>

      <!-- Demo Mode Alert -->
      <a-alert
        v-if="authStore.isDemo"
        message="Demo Mode Active"
        description="Bus type details can be viewed but modifications are disabled."
        type="warning"
        show-icon
        class="mb-6 rounded-xl"
      />

      <a-form :model="formState" layout="vertical" ref="formRef" :rules="rules">
        <a-form-item label="Name" name="name">
          <a-input v-model:value="formState.name" placeholder="e.g. AC Sleeper" :disabled="authStore.isDemo" />
        </a-form-item>

        <a-form-item label="Status" name="status">
          <a-switch v-model:checked="formState.status" :disabled="authStore.isDemo" />
          <span class="ml-2">{{ formState.status ? 'Active' : 'Inactive' }}</span>
        </a-form-item>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBusType } from '@/composables/useBusType';
import { bustypeService } from '@/services/bustype.service';
import { message, Modal } from 'ant-design-vue';
import LucideIcon from "@/components/LucideIcon.vue"
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()


const {
  loading,
  searchText,
  bustype,
  pagination,
  columns,
  handleTableChange,
  handleSearch,
  handleStatusChange,
  handleDelete,
  refresh
} = useBusType();

const canCreate = computed(() => authStore.hasPermission('bus.type.create'))
const canEdit = computed(() => authStore.hasPermission('bus.type.edit'))
const canDelete = computed(() => authStore.hasPermission('bus.type.delete'))

// Drawer State
const drawerVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref(null);
const editingId = ref(null);

const formState = reactive({
  name: '',
  status: true,
});

const rules = {
  name: [{ required: true, message: 'Bus Type name is required' }],
};

const openDrawer = (record = null) => {
  if (record) {
    if (!canEdit.value) {
      message.error('You do not have permission to edit bus types')
      return;
    }
    isEdit.value = true;
    editingId.value = record.id;
    Object.assign(formState, {
      name: record.name,
      status: record.status,
    });
  } else {
    if (authStore.isDemo) {
      Modal.warning({
        title: 'Action Restricted',
        content: 'Creating a new bus type is disabled in Demo Mode.',
      });
      return;
    }
    if (!canCreate.value) {
      message.error('You do not have permission to create bus types')
      return;
    }
    isEdit.value = false;
    editingId.value = null;
    Object.assign(formState, {
      name: '',
      status: true,
    });
  }
  drawerVisible.value = true;
};

const onStatusChange = (val, record) => {
  if (authStore.isDemo) {
    record.status = !val; // Revert
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating bus type status is disabled in Demo Mode.',
    })
    return
  }
  if (canEdit.value) {
    handleStatusChange(val, record)
  } else {
    message.error('You do not have permission to update bus type status')
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
    message.error('You do not have permission to delete bus types')
  }
}

const closeDrawer = () => {
  drawerVisible.value = false;
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    submitLoading.value = true;
    
    if (isEdit.value) {
      await bustypeService.update(editingId.value, formState);
      message.success('Bus Type updated successfully');
    } else {
      await bustypeService.create(formState);
      message.success('Bus Type created successfully');
    }
    
    closeDrawer();
    refresh();
  } catch (error) {
    console.error(error);
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
