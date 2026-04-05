<template>
  <div class="role-edit">
    <div class="flex items-center gap-4 mb-8">
      <a-button @click="router.back()" type="text" class="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100">
        <template #icon><LucideIcon name="ArrowLeft" :size="20" /></template>
      </a-button>
      <div>
        <h2 class="text-2xl font-bold text-gray-900 m-0">Edit Role</h2>
        <p class="text-gray-500 m-0 text-sm">Update role details and permissions scope.</p>
      </div>
    </div>

    <a-card :bordered="false" class="shadow-sm rounded-3xl p-6" :loading="fetching">
      <RoleForm v-if="role" ref="formRef" :initial-data="role" is-edit :disabled="isDemo" @submit="handleSubmit" />
      
      <div class="flex justify-end gap-4 mt-8 pt-8 border-t">
        <a-button @click="router.back()" class="rounded-xl px-8">Cancel</a-button>
        <a-button 
          type="primary" 
          :loading="loading" 
          :disabled="isDemo"
          @click="() => formRef.submit()" 
          class="rounded-xl px-12 bg-blue-600 shadow-lg shadow-blue-200"
        >
          Update Role
        </a-button>
      </div>

      <a-alert
        v-if="isDemo"
        message="Demo Mode Active"
        description="Role permissions can be viewed but modifications are disabled."
        type="warning"
        show-icon
        class="mt-6 rounded-2xl shadow-sm ring-1 ring-amber-100"
      />
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { roleService } from '@/services/role.service'
import { useAuthStore } from '@/stores/auth'
import { message, Modal } from 'ant-design-vue'
import LucideIcon from '@/components/LucideIcon.vue'
import RoleForm from './components/RoleForm.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const formRef = ref(null)
const loading = ref(false)
const fetching = ref(false)
const role = ref(null)

const isDemo = computed(() => authStore.isDemo)

const fetchRole = async () => {
  try {
    fetching.value = true
    const id = route.params.id
    const response = await roleService.getById(id)
    const data = response.data || response // Adjust based on API structure
    if (data) {
      role.value = {
        name: data.name,
        slug: data.slug,
        permissions: data.permissions || [],
        status: data.status,
        id: data.id || data._id
      }
    }
  } catch (error) {
    console.error(error)
    message.error('Failed to load role data')
  } finally {
    fetching.value = false
  }
}

const handleSubmit = async (payload) => {
  if (isDemo.value) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating role permissions is disabled in Demo Mode.',
    });
    return;
  }
  try {
    loading.value = true
    await roleService.update(route.params.id, payload)
    
    // If the edited role is the current user's role, refresh their access
    if (authStore.user?.roleId === route.params.id) {
      await authStore.fetchAccess()
    }

    message.success('Role updated successfully')
    router.push({ name: 'roles' })
  } catch (error) {
    console.error(error)
    message.error(error.response?.data?.message || 'Failed to update role')
  } finally {
    loading.value = false
  }
}

onMounted(fetchRole)
</script>
