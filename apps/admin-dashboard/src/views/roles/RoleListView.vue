<template>
  <div class="role-list">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Roles Management</h2>
        <p class="text-gray-500 text-sm">View and manage all system roles and their assigned permissions.</p>
      </div>
      <div class="flex items-center gap-3">
        <a-button 
          v-if="canCreate"
          type="primary" 
          @click="handleCreate" 
          class="flex items-center rounded-xl bg-blue-600 border-none shadow-lg shadow-blue-100 h-10"
        >
          <LucideIcon name="Plus" :size="18" class="mr-2" />
          Add New Role
        </a-button>
        <a-button 
          v-else
          type="primary" 
          @click="handleCreate" 
          class="flex items-center rounded-xl bg-gray-400 border-none shadow-lg h-10"
        >
          <LucideIcon name="Plus" :size="18" class="mr-2" />
          Add New Role
        </a-button>
      </div>
    </div>

    <a-card :bordered="false" class="shadow-sm rounded-3xl overflow-hidden">
      <div class="mb-6 flex flex-wrap gap-4 items-center">
        <a-input
          v-model:value="searchText"
          placeholder="Search role name or slug..."
          class="w-full md:w-80 rounded-xl"
          @input="handleSearch"
        >
          <template #prefix>
            <LucideIcon name="Search" :size="16" class="text-gray-400" />
          </template>
        </a-input>

        <a-button @click="refresh" :loading="loading" class="rounded-xl">
          <LucideIcon name="RotateCcw" :size="18" />
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="roles"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'permissions_count'">
             <a-tag color="blue" class="rounded-lg font-bold border-none px-3">
                {{ record.permissions_count }} Permissions
             </a-tag>
          </template>


          <template v-if="column.key === 'action'">
            <div class="flex gap-2">
              <a-tooltip :title="canEdit ? 'Edit Role' : 'No Permission to Edit'">
                <a-button type="text" @click="handleEdit(record.id)">
                  <template #icon><LucideIcon name="Pencil" :size="16" :class="canEdit ? 'text-blue-500' : 'text-gray-300'" /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="Delete Role" v-if="authStore.user?.roleId !== record.id && canDelete">
                <a-popconfirm
                  title="Delete this role? Users with this role may lose access."
                  @confirm="handleDelete(record.id)"
                >
                  <a-button type="text">
                    <template #icon><LucideIcon name="Trash2" :size="16" class="text-red-500" /></template>
                  </a-button>
                </a-popconfirm>
              </a-tooltip>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRole } from '@/composables/useRole'
import { message, Modal } from 'ant-design-vue'
import LucideIcon from '@/components/LucideIcon.vue'

const router = useRouter()
const authStore = useAuthStore()
const {
  loading,
  searchText,
  roles,
  pagination,
  columns,
  handleTableChange,
  handleSearch,
  handleStatusChange,
  handleDelete,
  refresh
} = useRole();

const canCreate = computed(() => authStore.hasPermission('role.create'))
const canEdit = computed(() => authStore.hasPermission('role.edit'))
const canDelete = computed(() => authStore.hasPermission('role.delete'))

const handleCreate = () => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Creating a new role is disabled in Demo Mode.',
    })
    return
  }
  if (canCreate.value) {
    router.push({ name: 'role-create' })
  } else {
    message.error('You do not have permission to create roles')
  }
}

const handleEdit = (id) => {
  if (authStore.isDemo) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Editing role permissions is disabled in Demo Mode.',
    })
    return
  }
  if (canEdit.value) {
    router.push({ name: 'role-edit', params: { id } })
  } else {
    message.error('You do not have permission to edit roles')
  }
}
</script>

<style scoped>
@reference "tailwindcss";

:deep(.ant-table-thead > tr > th) {
  @apply bg-gray-50/50;
}
</style>
