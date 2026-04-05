<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { userService } from '@/services/user.service'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import UserForm from '@/components/users/UserForm.vue'
import LucideIcon from '@/components/LucideIcon.vue'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const loading = ref(false)
const submitting = ref(false)
const record = ref(null)

const isDemo = computed(() => authStore.isDemo)

const fetchUser = async () => {
  loading.value = true
  try {
    const res = await userService.getById(route.params.id)
    if (res.status) {
      record.value = res.data
    } else {
      message.error('user member not found')
      router.push({ name: 'users-list' })
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    message.error('Failed to load staff details')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (values) => {
  if (isDemo.value) {
    Modal.warning({
      title: 'Action Restricted',
      content: 'Updating user details is disabled in Demo Mode.',
    });
    return;
  }
  submitting.value = true
  try {
    const res = await userService.update(route.params.id, values)
    if (res.status) {
      message.success('User details updated successfully')
      router.push({ name: 'users-list' })
    } else {
      message.error(res.message || 'Failed to update user')
    }
  } catch (error) {
    console.error('Update error:', error)
    message.error('An error occurred during update')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchUser()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-3xl border shadow-sm transition-all duration-300 backdrop-blur-sm gap-4"
      :class="themeStore.isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-100'"
    >
      <div class="flex items-center gap-4">
        <a-button
          shape="circle"
          class="flex items-center justify-center hover:scale-110 transition-transform"
          @click="router.push({ name: 'users-list' })"
        >
          <LucideIcon name="ChevronLeft" :size="20" />
        </a-button>
        <div
          class="p-3 rounded-2xl transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'"
        >
          <LucideIcon name="UserCog" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Edit User
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Update profile and access settings for {{ record?.firstname || 'user' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Demo Mode Alert -->
    <a-alert
      v-if="isDemo"
      message="Demo Mode Active"
      description="User details can be viewed but modifications are disabled."
      type="warning"
      show-icon
      class="rounded-xl shadow-sm ring-1 ring-amber-100"
    />

    <!-- Form Section -->
    <div v-if="loading" class="flex justify-center py-20">
      <a-spin size="large" />
    </div>
    <div v-else>
      <UserForm
        :record="record"
        :is-edit="true"
        :loading="submitting"
        :disabled="isDemo"
        @submit="handleSubmit"
        @cancel="router.push({ name: 'users-list' })"
      />
    </div>
  </div>
</template>
