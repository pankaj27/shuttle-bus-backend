<template>
  <div class="currency-list">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Currency Management</h2>
        <p class="text-gray-500 text-sm">Manage supported currencies.</p>
      </div>
      <a-button type="primary" :disabled="!canCreate" @click="openDrawer()">
        <LucideIcon name="Plus" :size="16" class="mr-2" />
        Add New Currency
      </a-button>
    </div>

    <!-- Table Card -->
    <a-card :bordered="false" class="shadow-sm">
      <div class="mb-4 flex flex-wrap gap-4 items-center">
        <a-input-search
          v-model:value="searchText"
          placeholder="Search currency name or code..."
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
        :data-source="currencies"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-switch
              v-model:checked="record.status"
              :loading="record.statusLoading"
              :disabled="!canEdit || record.code === authStore.generalSettings?.default_currency || record.name === authStore.generalSettings?.default_currency"
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
              <a-tooltip 
                v-if="record.code !== authStore.generalSettings?.default_currency && record.name !== authStore.generalSettings?.default_currency"
                :title="canDelete ? 'Delete' : 'No Permission to Delete'"
              >
                <a-popconfirm
                  v-if="canDelete"
                  title="Are you sure delete this currency?"
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
    <a-drawer
      v-model:open="drawerVisible"
      :title="isEdit ? 'Edit Currency' : 'Add New Currency'"
      placement="right"
      width="400"
      :closable="true"
      @close="closeDrawer"
    >
      <a-form :model="formState" layout="vertical" ref="formRef" :rules="rules">
        <a-form-item label="Currency Name" name="name">
          <a-input v-model:value="formState.name" placeholder="e.g. India" :disabled="authStore.isDemo" />
        </a-form-item>
        
        <a-form-item label="Code" name="code">
          <a-input 
            v-model:value="formState.code" 
            placeholder="e.g. INR or USD" 
            :maxlength="4"
            @input="handleShortNameInput"
            :disabled="authStore.isDemo"
          />
        </a-form-item>

        <a-form-item label="Symbol" name="symbol">
          <a-input 
            v-model:value="formState.symbol" 
            placeholder="e.g. ₹ or $" 
            :maxlength="4"
            :disabled="authStore.isDemo"
          />
        </a-form-item>

        <a-form-item label="Status" name="status">
          <a-switch v-model:checked="formState.status" :disabled="authStore.isDemo" />
          <span class="ml-2">{{ formState.status ? 'Active' : 'Inactive' }}</span>
        </a-form-item>

        <div class="mt-8 flex gap-3">
          <a-button @click="closeDrawer" class="flex-1">Cancel</a-button>
          <a-button type="primary" :loading="submitLoading" @click="handleSubmit" class="flex-1">
            {{ isEdit ? 'Update' : 'Create' }}
          </a-button>
        </div>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useCurrencies } from '@/composables/useCurrencies';
import { currencyService } from '@/services/currency.service';
import { message, Modal } from 'ant-design-vue';
import LucideIcon from '@/components/LucideIcon.vue'

const authStore = useAuthStore()

const {
  loading,
  searchText,
  currencies,
  pagination,
  columns,
  handleTableChange,
  handleSearch,
  handleStatusChange,
  handleDelete,
  refresh
} = useCurrencies();

const canCreate = computed(() => authStore.hasPermission('manage.application.settings'))
const canEdit = computed(() => authStore.hasPermission('manage.application.settings'))
const canDelete = computed(() => authStore.hasPermission('manage.application.settings'))

// Drawer State
const drawerVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref(null);
const editingId = ref(null);

const formState = reactive({
  name: '',
  code: '',
  symbol: '',
  rate:0,
  status: true,
});

const rules = {
  name: [{ required: true, message: 'Currency name is required' }],
  code: [
    { required: true, message: 'Code is required' },
    { max: 4, message: 'Maximum 4 characters allowed' }
  ],
  symbol: [
    { required: true, message: 'Symbol is required' },
    { max: 4, message: 'Maximum 4 characters allowed' }
  ],
};

const handleShortNameInput = (e) => {
  formState.short_name = e.target.value.toUpperCase();
};

const openDrawer = (record = null) => {
  if (record) {
    if (!canEdit.value) {
      message.error('You do not have permission to edit currencies')
      return;
    }
    isEdit.value = true;
    editingId.value = record.id;
    Object.assign(formState, {
      name: record.name,
      code: record.code,
      symbol: record.symbol,
      rate:record.rate,
      status: record.status,
    });
  } else {
    if (authStore.isDemo) {
      Modal.warning({
        title: 'Action Restricted',
        content: 'Adding a new currency is disabled in Demo Mode.',
      });
      return;
    }
    if (!canCreate.value) {
      message.error('You do not have permission to create currencies')
      return;
    }
    isEdit.value = false;
    editingId.value = null;
    Object.assign(formState, {
      name: '',
      code: '',
      symbol: '',
         rate:0,
      status: true,
    });
  }
  drawerVisible.value = true;
};

const onStatusChange = (val, record) => {
  if (authStore.isDemo) {
    record.status = !val // Revert
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating currency status is disabled in Demo Mode.',
    })
    return
  }
  if (!canEdit.value) {
    message.error('You do not have permission to update currency status')
    return
  }

  if (record.code === authStore.generalSettings?.default_currency || record.name === authStore.generalSettings?.default_currency) {
    message.error('Cannot disable the default currency')
    // Reset the switch state locally
    record.status = !val
    return
  }

  handleStatusChange(val, record)
}

const onDeleteConfirm = (id) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Data deletion is disabled in Demo Mode.',
    })
    return
  }
  if (!canDelete.value) {
    message.error('You do not have permission to delete currencies')
    return
  }

  const currency = currencies.value.find((c) => c.id === id)
  if (
    currency?.code === authStore.generalSettings?.default_currency ||
    currency?.name === authStore.generalSettings?.default_currency
  ) {
    message.error('Cannot delete the default currency')
    return
  }

  handleDelete(id)
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
      await currencyService.update(editingId.value, formState);
      message.success('Currency updated successfully');
    } else {
      await currencyService.create(formState);
      message.success('Currency created successfully');
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
