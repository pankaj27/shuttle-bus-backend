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
          <LucideIcon name="Bell" :size="24" />
        </div>
        <div>
          <h1   
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Notification Management
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Manage and schedule push notifications
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
        Create Notification
      </a-button>
    </div>

    <!-- Table Card -->
    <a-card :bordered="false" class="shadow-sm">
      <div class="mb-4 flex flex-wrap gap-4 items-center">
        <a-input-search
          v-model:value="searchText"
          placeholder="Search notifications..."
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
        :data-source="notifications"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <div class="flex items-center gap-3">
              <a-avatar v-if="record.notification_picture" :src="record.notification_picture" />
              <div class="flex flex-col">
                <span class="font-bold">{{ record.notification_title }}</span>
                <span class="text-xs text-gray-400 truncate max-w-[200px]">{{ record.notification_body }}</span>
              </div>
            </div>
          </template>

          <template v-if="column.key === 'user_type'">
            <a-tag color="blue">{{ record.user_type }}</a-tag>
          </template>

          <template v-if="column.key === 'send_total'">
            <div class="flex flex-col items-center text-xs">
              <span class="text-green-600 font-bold">
                {{ record.send_total.success_count }} Sent
              </span>
              <span v-if="record.send_total.failed_count > 0" class="text-red-500">
                {{ record.send_total.failed_count }} Failed
              </span>
            </div>
          </template>



          <template v-if="column.key === 'action'">
            <div class="flex gap-2">
              <a-tooltip title="View Details">
                <a-button type="text" @click="openDetails(record)">
                  <template #icon><LucideIcon name="Eye" :size="16" class="text-blue-500" /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="canEdit ? 'Edit' : 'No Permission to Edit'">
                <a-button type="text" @click="openDrawer(record)">
                  <template #icon><LucideIcon name="Pencil" :size="16" :class="canEdit ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-gray-600'" /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="canDelete ? 'Delete' : 'No Permission to Delete'">
                <a-popconfirm
                  v-if="canDelete"
                  title="Are you sure delete this notification?"
                  @confirm="onDeleteConfirm(record)"
                >
                  <a-button type="text">
                    <template #icon><LucideIcon name="Trash2" :size="16" class="text-red-500" /></template>
                  </a-button>
                </a-popconfirm>
                <a-button v-else type="text" @click="onDeleteConfirm(record)">
                  <template #icon><LucideIcon name="Trash2" :size="16" class="text-gray-300 dark:text-gray-600" /></template>
                </a-button>
              </a-tooltip>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:open="drawerVisible"
      :title="isEdit ? 'Edit Notification' : 'Add New Notification'"
      placement="right"
      width="950"
      :closable="true"
      @close="closeDrawer"
      :maskClosable="false"
    >
      <template #extra>
        <a-space>
          <a-button @click="closeDrawer">Cancel</a-button>
          <a-button type="primary" :loading="submitLoading" @click="() => formRef.submit()">
            {{ isEdit ? 'Update' : 'Create' }}
          </a-button>
        </a-space>
      </template>

      <NotificationForm 
        ref="formRef"
        :initial-data="editingRecord"
        :is-edit="isEdit"
        :loading="submitLoading"
        @submit="handleFinalSubmit"
      />
    </a-drawer>

    <!-- Details Drawer -->
    <a-drawer
      v-model:open="detailsVisible"
      title="Notification Details"
      placement="right"
      width="600"
      :closable="true"
      @close="closeDetails"
    >
      <NotificationDetails 
        v-if="detailsRecord" 
        :notification="detailsRecord" 
      />
      <template #extra>
        <a-button type="primary" @click="openDrawer(detailsRecord)">
          <template #icon><LucideIcon name="Pencil" :size="14" class="mr-1" /></template>
          Edit
        </a-button>
      </template>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, toRaw, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotification } from '@/composables/useNotification';
import { notificationService } from '@/services/notification.service';
import { message, Modal } from 'ant-design-vue';
import LucideIcon from "@/components/LucideIcon.vue"
import { useThemeStore } from '@/stores/theme'
import NotificationForm from './components/NotificationForm.vue'
import NotificationDetails from './components/NotificationDetails.vue'

const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()


const {
  loading,
  searchText,
  notifications,
  pagination,
  columns,
  handleTableChange,
  handleSearch,
  handleStatusChange,
  handleDelete,
  refresh
} = useNotification();

const canCreate = computed(() => authStore.hasPermission('notification.create'))
const canEdit = computed(() => authStore.hasPermission('notification.edit'))
const canDelete = computed(() => authStore.hasPermission('notification.delete'))

// Drawer State
const drawerVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref(null);
const editingRecord = ref(null);

const openDrawer = (record = null) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: `${record ? 'Editing notification' : 'Creating a new notification'} is disabled in Demo Mode.`,
    });
    return;
  }
  if (record) {
    if (!canEdit.value) {
      message.error('You do not have permission to edit notifications')
      return;
    }
    isEdit.value = true;
    editingRecord.value = { 
      ...toRaw(record), 
      time: record.schedule === 'immediately' ? null : record.time 
    };
  } else {
    if (!canCreate.value) {
      message.error('You do not have permission to create notifications')
      return;
    }
    isEdit.value = false;
    editingRecord.value = null;
    formRef.value?.reset();
  }
  detailsVisible.value = false; // Close details drawer if it's open
  drawerVisible.value = true;
};

const onDeleteConfirm = (record) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Data deletion is disabled in Demo Mode.',
    })
    return
  }
  if (canDelete.value) {
    handleDelete(record);
  } else {
    message.error('You do not have permission to delete notifications');
  }
};

const closeDrawer = () => {
  drawerVisible.value = false;
  editingRecord.value = null;
  formRef.value?.reset(); // Clean up on close
};

// Details State
const detailsVisible = ref(false);
const detailsRecord = ref(null);

const openDetails = (record) => {
  detailsRecord.value = record;
  detailsVisible.value = true;
};

const closeDetails = () => {
  detailsVisible.value = false;
  detailsRecord.value = null;
};

const handleFinalSubmit = async (payload) => {
  try {
    submitLoading.value = true;
    
    if (isEdit.value) {
      await notificationService.update(editingRecord.value.id, payload);
      message.success('Notification updated successfully');
    } else {
      await notificationService.create(payload);
      message.success('Notification created successfully');
    }
    
    closeDrawer();
    refresh();
  } catch (error) {
    console.error(error);
    message.error(error.message || 'Failed to save notification');
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
