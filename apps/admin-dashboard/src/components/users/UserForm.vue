<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useThemeStore } from '@/stores/theme'
import LucideIcon from '@/components/LucideIcon.vue'
import FileUpload from '@/components/FileUpload.vue'
import { userService } from '@/services/user.service'
import { roleService } from '@/services/role.service'
import PhoneInput from '@/components/PhoneInput.vue'

const props = defineProps({
  record: { type: Object, default: null },
  isEdit: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'cancel'])

const themeStore = useThemeStore()
const formRef = ref(null)
const roles = ref([])
const loadingRoles = ref(false)

const formState = reactive({
  profile_picture: '',
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  country_code: '91',
  phone: '',
  city: '',
  role: 'Staff',
  address_1: '',
  address_2: '',
  pincode: '',
  status: true,
})

const rules = {
  firstname: [{ required: true, message: 'First name is required' }],
  lastname: [{ required: true, message: 'Last name is required' }],
  email: [
    { required: true, message: 'Email is required' },
    { type: 'email', message: 'Please enter a valid email' },
  ],
  password: [{ required: !props.isEdit, message: 'Password is required' }],
  phone: [{ required: true, message: 'Phone number is required' }],
  role: [{ required: true, message: 'Role is required' }],
}

const fetchRoles = async () => {
  try {
    loadingRoles.value = true
    const res = await roleService.getList()
    if (res.status) {
      roles.value = res.data
    }
  } catch (error) {
    console.error('Failed to fetch roles:', error)
    message.error('Failed to load roles')
  } finally {
    loadingRoles.value = false
  }
}

onMounted(() => {
  fetchRoles()
})

watch(
  () => props.record,
  (newRecord) => {
    if (newRecord) {
      Object.assign(formState, {
        profile_picture: newRecord.profile_picture || '',
        firstname: newRecord.firstname || '',
        lastname: newRecord.lastname || '',
        email: newRecord.email || '',
        password: '', // Don't populate password
        country_code: newRecord.country_code || '91',
        phone: newRecord.phone || '',
        city: newRecord.city || '',
        role: newRecord.role || 'Staff',
        address_1: newRecord.address_1 || '',
        address_2: newRecord.address_2 || '',
        pincode: newRecord.pincode || '',
        status: newRecord.status !== undefined ? newRecord.status : true,
      })
    } else {
      // Reset form
      Object.assign(formState, {
        profile_picture: '',
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        country_code: '91',
        phone: '',
        city: '',
        role: 'staff',
        address_1: '',
        address_2: '',
        pincode: '',
        status: true,
      })
    }
  },
  { immediate: true },
)

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    const data = { ...formState }
    if (props.isEdit && !data.password) {
      delete data.password
    }
    emit('submit', data)
  } catch (error) {
    console.error('Validation Error:', error)
  }
}

defineExpose({
  submit: handleSubmit,
})
</script>

<template>
  <a-form
    :model="formState"
    layout="vertical"
    ref="formRef"
    :rules="rules"
    class="user-form"
    :class="{ dark: themeStore.isDark }"
  >
    <a-row :gutter="24">
      <!-- Left Column: Profile & Basics -->
      <a-col :xs="24" :lg="8">
        <a-card :bordered="false" class="shadow-sm rounded-lg overflow-hidden mb-4">
          <template #title>
            <div class="flex items-center gap-2">
              <LucideIcon name="User" class="text-blue-500" :size="18" />
              <span>Profile Image</span>
            </div>
          </template>
          <div class="flex justify-center py-4">
            <FileUpload
              v-model:value="formState.profile_picture"
              folder="admins"
              :multiple="false"
              help-text="Upload profile picture"
              :disabled="disabled"
            />
          </div>
        </a-card>

        <a-card :bordered="false" class="shadow-sm rounded-2xl overflow-hidden">
          <template #title>
            <div class="flex items-center gap-2">
              <LucideIcon name="Shield" class="text-purple-500" :size="18" />
              <span>Access Control</span>
            </div>
          </template>

          <a-form-item label="Role" name="role">
            <a-select 
              v-model:value="formState.role" 
              placeholder="Select access role"
              :loading="loadingRoles"
              :options="roles"
              :disabled="disabled"
            >
            </a-select>
          </a-form-item>

          <a-form-item label="Status" name="status">
            <div
              class="flex items-center justify-between p-4 rounded-xl transition-colors duration-300 border"
              :class="
                themeStore.isDark
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-gray-50 border-gray-100'
              "
            >
              <div class="flex flex-col">
                <span
                  class="font-medium"
                  :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-700'"
                >
                  {{ formState.status ? 'Active' : 'Inactive' }}
                </span>
                <span class="text-xs text-gray-400">
                  {{ formState.status ? 'User can log in' : 'Access restricted' }}
                </span>
              </div>
              <a-switch v-model:checked="formState.status" :disabled="disabled" />
            </div>
          </a-form-item>
        </a-card>
      </a-col>

      <!-- Right Column: Personal & Contact Details -->
      <a-col :xs="24" :lg="16">
        <a-card :bordered="false" class="shadow-sm rounded-2xl overflow-hidden mb-6">
          <template #title>
            <div class="flex items-center gap-2">
              <LucideIcon name="Contact" class="text-orange-500" :size="18" />
              <span>Personal Details</span>
            </div>
          </template>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="First Name" name="firstname">
                <a-input v-model:value="formState.firstname" placeholder="Enter first name" :disabled="disabled" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Last Name" name="lastname">
                <a-input v-model:value="formState.lastname" placeholder="Enter last name" :disabled="disabled" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="Email Address" name="email">
                <a-input v-model:value="formState.email" placeholder="email@example.com" :disabled="disabled" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Phone Number" name="phone">
                <PhoneInput
                  v-model:code="formState.country_code"
                  v-model:number="formState.phone"
                  :disabled="disabled"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="Password" name="password">
            <a-input-password v-model:value="formState.password" placeholder="••••••••" :disabled="disabled" />
          </a-form-item>
        </a-card>

        <a-card :bordered="false" class="shadow-sm rounded-2xl overflow-hidden">
          <template #title>
            <div class="flex items-center gap-2">
              <LucideIcon name="MapPin" class="text-green-500" :size="18" />
              <span>Address Details</span>
            </div>
          </template>

          <a-form-item label="Address Line 1" name="address_1">
            <a-input v-model:value="formState.address_1" placeholder="Street address, P.O. box" :disabled="disabled" />
          </a-form-item>

          <a-form-item label="Address Line 2" name="address_2">
            <a-input v-model:value="formState.address_2" placeholder="Apartment, suite, unit, building, floor" :disabled="disabled" />
          </a-form-item>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="City" name="city">
                <a-input v-model:value="formState.city" placeholder="Enter city" :disabled="disabled" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Pincode / ZIP" name="pincode">
                <a-input v-model:value="formState.pincode" placeholder="Enter pincode" :disabled="disabled" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>
      </a-col>
    </a-row>

    <!-- Action Buttons -->
    <div v-if="!disabled" class="flex items-center justify-end gap-3 mt-8">
      <a-button
        size="large"
        @click="emit('cancel')"
        class="px-8 rounded-xl flex items-center gap-2"
      >
        Cancel
      </a-button>
      <a-button
        type="primary"
        size="large"
        @click="handleSubmit"
        :loading="loading"
        class="px-10 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20"
      >
        <template #icon><LucideIcon :name="isEdit ? 'Save' : 'UserPlus'" :size="18" /></template>
        {{ isEdit ? 'Update User' : 'Create User' }}
      </a-button>
    </div>
  </a-form>
</template>

<style scoped>
@reference "tailwindcss";

:deep(.ant-card-head) {
  border-bottom: 1px solid v-bind('themeStore.isDark ? "#374151" : "#f0f0f0"');
  padding: 0 24px;
}

:deep(.ant-card-body) {
  padding: 24px;
}

:deep(.ant-form-item-label > label) {
  @apply font-semibold;
  color: v-bind('themeStore.isDark ? "#9ca3af" : "#4b5563"');
}

.user-form.dark :deep(.ant-input),
.user-form.dark :deep(.ant-input-password),
.user-form.dark :deep(.ant-select-selector) {
  @apply bg-gray-800! border-gray-700! text-gray-200!;
}
</style>
