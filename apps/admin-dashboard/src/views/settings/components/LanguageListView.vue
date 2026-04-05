<template>
  <div class="language-list">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Language Management</h2>
        <p class="text-gray-500 text-sm">Manage supported languages and dial codes.</p>
      </div>
      <a-button type="primary" :disabled="!canCreate" @click="openDrawer()">
        <LucideIcon name="Plus" :size="16" class="mr-2" />
        Add New Language
      </a-button>
    </div>

    <!-- Table Card -->
    <a-card :bordered="false" class="shadow-sm">
      <div class="mb-4 flex flex-wrap gap-4 items-center">
        <a-input-search
          v-model:value="searchText"
          placeholder="Search language name or code..."
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
        :data-source="languages"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-switch
              v-model:checked="record.status"
              :loading="record.statusLoading"
              :disabled="!canEdit || record.code === authStore.generalSettings?.default_language"
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
                v-if="record.code !== authStore.generalSettings?.default_language"
                :title="canDelete ? 'Delete' : 'No Permission to Delete'"
              >
                <a-popconfirm
                  v-if="canDelete"
                  title="Are you sure you want to delete this language?"
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
      :title="isEdit ? 'Edit Language' : 'Add New Language'"
      placement="right"
      width="400"
      :closable="true"
      @close="closeDrawer"
    >
      <a-form :model="formState" layout="vertical" ref="formRef" :rules="rules">
        <a-form-item label="Language Name" name="label">
          <a-input v-model:value="formState.label" placeholder="e.g. English" :disabled="authStore.isDemo" />
        </a-form-item>
        
        <a-form-item label="Language Code" name="code">
          <a-input 
            v-model:value="formState.code" 
            placeholder="e.g. en" 
            :maxlength="10"
            @input="handleCodeInput"
            :disabled="authStore.isDemo"
          />
        </a-form-item>

        <a-form-item label="Associated Country" name="countryId">
            <a-select 
              v-model:value="formState.countryId" 
              placeholder="Select associated country"
              :options="countryOptions"
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useLanguages } from '@/composables/useLanguages';
import { languageService } from '@/services/language.service';
import { countryService } from '@/services/country.service';
import { message, Modal } from 'ant-design-vue';
import LucideIcon from '@/components/LucideIcon.vue'

const authStore = useAuthStore()

const {
  loading,
  searchText,
  languages,
  pagination,
  columns,
  handleTableChange,
  handleSearch,
  handleStatusChange,
  handleDelete,
  refresh
} = useLanguages();

const canCreate = computed(() => authStore.hasPermission('manage.application.settings'))
const canEdit = computed(() => authStore.hasPermission('manage.application.settings'))
const canDelete = computed(() => authStore.hasPermission('manage.application.settings'))

// Drawer State
const drawerVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref(null);
const editingId = ref(null);
const countryOptions = ref([]);

const formState = reactive({
  label: '',
  code: '',
  countryId: null,
  status: true,
});

const rules = {
  label: [{ required: true, message: 'Language name is required' }],
  code: [
    { required: true, message: 'Language code is required' },
  ],
  countryId: [
    { required: true, message: 'Country is required' },
  ],
};

const handleCodeInput = (e) => {
  formState.code = e.target.value.toLowerCase();
};

const openDrawer = (record = null) => {
  if (record) {
    if (!canEdit.value) {
      message.error('You do not have permission to edit languages')
      return;
    }
    isEdit.value = true;
    editingId.value = record.id;
    Object.assign(formState, {
      label: record.label,
      code: record.code,
      countryId: record.countryId || null,
      status: record.status,
    });
  } else {
    if (authStore.isDemo) {
      Modal.warning({
        title: 'Action Restricted',
        content: 'Adding a new language is disabled in Demo Mode.',
      });
      return;
    }
    if (!canCreate.value) {
      message.error('You do not have permission to create languages')
      return;
    }
    isEdit.value = false;
    editingId.value = null;
    Object.assign(formState, {
      label: '',
      code: '',
      countryId: null,
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
      content: 'Updating language status is disabled in Demo Mode.',
    })
    return
  }
  if (!canEdit.value) {
    message.error('You do not have permission to update language status')
    return
  }

  if (record.code === authStore.generalSettings?.default_language) {
    message.error('Cannot disable the default language')
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
    message.error('You do not have permission to delete languages')
    return
  }

  const lang = languages.value.find((c) => c.id === id)
  if (lang?.code === authStore.generalSettings?.default_language) {
    message.error('Cannot delete the default language')
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
      await languageService.update(editingId.value, formState);
      message.success('Language updated successfully');
    } else {
      await languageService.create(formState);
      message.success('Language created successfully');
    }
    
    closeDrawer();
    refresh();
  } catch (error) {
    console.error(error);
  } finally {
    submitLoading.value = false;
  }
};

const fetchCountryOptions = async () => {
    try {
        const response = await countryService.getList();
        // Assume API returns array [{name, _id}]
        // Update: Based on Mongoose Country transform, we might need a custom mapping
        // We'll map whatever comes back into antd select format
        const data = response.data?.items || response.data || response || [];
        // Extract items if embedded
        const items = Array.isArray(data) ? data : (data.items || []);
        countryOptions.value = items.map(c => ({
            label: c.name || c.label,
            value: c.ids
        }));
    } catch(err) {
        console.error(err);
    }
};

onMounted(() => {
    fetchCountryOptions();
});
</script>

<style scoped>
@reference "tailwindcss";

:deep(.ant-table-thead > tr > th) {
  @apply bg-gray-50/50;
}
</style>
