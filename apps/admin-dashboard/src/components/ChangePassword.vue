<template>
  <a-modal
    v-model:open="visible"
    title="Change Password"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    :width="500"
    :maskClosable="false"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="rules"
      layout="vertical"
      class="mt-4"
    >
      <a-form-item label="Current Password" name="currentPassword">
        <a-input-password
          v-model:value="formState.currentPassword"
          placeholder="Enter your current password"
          size="large"
          autocomplete="current-password"
        >
          <template #prefix>
            <lock :size="16" class="text-gray-400" />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item label="New Password" name="newPassword">
        <a-input-password
          v-model:value="formState.newPassword"
          placeholder="Enter your new password"
          size="large"
          autocomplete="new-password"
        >
          <template #prefix>
            <key :size="16" class="text-gray-400" />
          </template>
        </a-input-password>
        <p class="text-xs text-gray-500 mt-1">
          Password must be at least 8 characters long
        </p>
      </a-form-item>

      <a-form-item label="Confirm New Password" name="confirmPassword">
        <a-input-password
          v-model:value="formState.confirmPassword"
          placeholder="Confirm your new password"
          size="large"
          autocomplete="new-password"
        >
          <template #prefix>
            <shield-check :size="16" class="text-gray-400" />
          </template>
        </a-input-password>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { Lock, Key, ShieldCheck } from 'lucide-vue-next'
import { message } from 'ant-design-vue'
import { userService } from '@/services/user.service'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open', 'success'])

const authStore = useAuthStore()
const formRef = ref()
const loading = ref(false)
const visible = ref(false)

const formState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Validation rules
const validateConfirmPassword = async (_rule, value) => {
  if (value === '') {
    return Promise.reject('Please confirm your new password')
  } else if (value !== formState.newPassword) {
    return Promise.reject('Passwords do not match')
  } else {
    return Promise.resolve()
  }
}

const rules = {
  currentPassword: [
    { required: true, message: 'Please enter your current password', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: 'Please enter a new password', trigger: 'blur' },
    { min: 8, message: 'Password must be at least 8 characters', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'change' }
  ]
}

// Watch for prop changes
watch(() => props.open, (newVal) => {
  visible.value = newVal
})

watch(visible, (newVal) => {
  emit('update:open', newVal)
  if (!newVal) {
    resetForm()
  }
})

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    loading.value = true

    const payload = {
      newPassword: formState.newPassword,
    }

    await userService.changePassword(authStore.user.id, payload)
    
    message.success('Password changed successfully')
    emit('success')
    visible.value = false
  } catch (error) {
    if (error.errorFields) {
      // Validation error
      return
    }
    console.error('Change password error:', error)
    message.error(error.response?.data?.message || 'Failed to change password')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  visible.value = false
}

const resetForm = () => {
  formRef.value?.resetFields()
  formState.currentPassword = ''
  formState.newPassword = ''
  formState.confirmPassword = ''
}
</script>

<style scoped>
@reference "tailwindcss";

:deep(.ant-modal-header) {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-modal-footer) {
  border-top: 1px solid #f0f0f0;
}

.dark :deep(.ant-modal-header),
.dark :deep(.ant-modal-footer) {
  border-color: #374151;
}

:deep(.ant-input-affix-wrapper) {
  border-radius: 8px;
}

:deep(.ant-input-password) {
  border-radius: 8px;
}
</style>
