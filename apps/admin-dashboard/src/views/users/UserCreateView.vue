<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { userService } from '@/services/user.service'
import { useThemeStore } from '@/stores/theme'
import UserForm from '@/components/users/UserForm.vue'
import LucideIcon from '@/components/LucideIcon.vue'

const router = useRouter()
const themeStore = useThemeStore()
const submitting = ref(false)

const handleSubmit = async (values) => {
  submitting.value = true
  try {
    const res = await userService.create(values)
    if (res.status) {
      message.success('User created successfully')
      router.push({ name: 'users-list' })
    } else {
      message.error(res.message || 'Failed to create user')
    }
  } catch (error) {
    console.error('Creation error:', error)
    message.error('An error occurred while creating staff')
  } finally {
    submitting.value = false
  }
}
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
          <LucideIcon name="UserPlus" :size="24" />
        </div>
        <div>
          <h1
            class="text-2xl font-bold tracking-tight transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-100' : 'text-gray-800'"
          >
            Add New User
          </h1>
          <p
            class="text-sm mt-1 transition-colors duration-300"
            :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
          >
            Register a new user
          </p>
        </div>
      </div>
    </div>

    <!-- Form Section -->
    <UserForm
      :is-edit="false"
      :loading="submitting"
      @submit="handleSubmit"
      @cancel="router.push({ name: 'users-list' })"
    />
  </div>
</template>