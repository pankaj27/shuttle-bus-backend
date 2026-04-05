<template>
  <div class="role-create">
    <div class="flex items-center gap-4 mb-8">
      <a-button @click="router.back()" type="text" class="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100">
        <template #icon><LucideIcon name="ArrowLeft" :size="20" /></template>
      </a-button>
      <div>
        <h2 class="text-2xl font-bold text-gray-900 m-0">Create New Role</h2>
        <p class="text-gray-500 m-0 text-sm">Define a new system role and assign its permission set.</p>
      </div>
    </div>

    <a-card :bordered="false" class="shadow-sm rounded-3xl p-6">
      <RoleForm ref="formRef" @submit="handleSubmit" />
      
      <div class="flex justify-end gap-4 mt-8 pt-8 border-t">
        <a-button @click="router.back()" class="rounded-xl px-8">Cancel</a-button>
        <a-button type="primary" :loading="loading" @click="() => formRef.submit()" class="rounded-xl px-12 bg-blue-600 shadow-lg shadow-blue-200">
          Create Role
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { roleService } from '@/services/role.service'
import { message } from 'ant-design-vue'
import LucideIcon from '@/components/LucideIcon.vue'
import RoleForm from './components/RoleForm.vue'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const handleSubmit = async (payload) => {
  try {
    loading.value = true
    await roleService.create(payload)
    message.success('Role created successfully')
    router.push({ name: 'roles' })
  } catch (error) {
    console.error(error)
    message.error(error.response?.data?.message || 'Failed to create role')
  } finally {
    loading.value = false
  }
}
</script>
