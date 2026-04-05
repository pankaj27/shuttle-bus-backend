<template>
  <a-form :model="formState" layout="vertical" @finish="onFinish" :rules="rules" ref="formRef">
    <a-row :gutter="24">
      <!-- Personal Information -->
      <a-col :xs="24" :lg="16">
        <a-card
          title="Customer Information"
          :bordered="false"
          class="mb-6 shadow-sm rounded-2xl transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
        >
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
                <a-input v-model:value="formState.email" placeholder="customer@example.com" :disabled="disabled" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Gender" name="gender">
                <a-select v-model:value="formState.gender" placeholder="Select gender" :disabled="disabled">
                  <a-select-option value="Male">Male</a-select-option>
                  <a-select-option value="Female">Female</a-select-option>
                  <a-select-option value="Other">Other</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="Mobile Contact" name="phone">
            <PhoneInput v-model:code="formState.country_code" v-model:number="formState.phone" :disabled="disabled" />
          </a-form-item>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="Status" name="status">
                <a-segmented
                  v-model:value="formState.status"
                  :options="['Active', 'Inactive']"
                  block
                  :disabled="disabled"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12" v-if="isEdit">
              <a-form-item label="Wallet Balance" name="wallet_balance">
                <a-input-number
                  v-model:value="formState.wallet_balance"
                  class="w-full"
                  disabled
                  :formatter="(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                  :parser="(value) => value.replace(/\$\s?|(,*)/g, '')"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <div v-if="!hideActions" class="mt-8 flex justify-end gap-4">
          <a-button size="large" @click="$router.back()" class="rounded-xl px-8">Cancel</a-button>
          <a-button
            type="primary"
            html-type="submit"
            :loading="loading"
            class="rounded-xl px-8 bg-blue-600 shadow-lg shadow-blue-200"
          >
            {{ isEdit ? 'Update Customer' : 'Create Customer' }}
          </a-button>
        </div>
      </a-col>

      <!-- Profile Photo -->
      <a-col :xs="24" :lg="8">
        <a-card
          title="Profile Photo"
          :bordered="false"
          class="shadow-sm rounded-2xl text-center transition-colors duration-300"
          :class="themeStore.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
        >
          <div class="flex flex-col items-center py-4">
            <FileUpload
              v-model:value="formState.picture"
              folder="customers"
              width="160px"
              height="160px"
              helpText="PNG, JPG < 2MB"
              :disabled="disabled"
            />
          </div>
        </a-card>
      </a-col>
    </a-row>
  </a-form>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import PhoneInput from '@/components/PhoneInput.vue'
import FileUpload from '@/components/FileUpload.vue'
import { message } from 'ant-design-vue'
import { useThemeStore } from '@/stores/theme'
import { useCustomer } from '@/composables/useCustomer'

const props = defineProps({
  initialData: {
    type: Object,
    default: null,
  },
  isEdit: Boolean,
  loading: Boolean,
  hideActions: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit'])
const themeStore = useThemeStore()

const formState = reactive({
  firstname: '',
  lastname: '',
  email: '',
  gender: '',
  country_code: '91',
  phone: '',
  status: 'Active',
  picture: '',
  wallet_balance: 0,
})

// Initialize form if editing
onMounted(async () => {
  if (props.initialData) {
    Object.assign(formState, props.initialData)
    // Map status bool to string if needed
    if (typeof props.initialData.status === 'boolean') {
      formState.status = props.initialData.status ? 'Active' : 'Inactive'
    }
  }
})

const { checkExistence } = useCustomer(false)

const checkField = (key, value) => {
  const id =
    props.isEdit && props.initialData ? props.initialData.id || props.initialData._id : undefined
  return checkExistence(key, value, id)
}

const rules = {
  firstname: [{ required: true, message: 'First name is required' }],
  lastname: [{ required: true, message: 'Last name is required' }],
  email: [
    { required: true, type: 'email', message: 'Please enter a valid email' },
    {
      validator: (_rule, value) => checkField('email', value),
      trigger: 'blur',
    },
  ],
  phone: [
    { required: true, message: 'Phone number is required' },
    {
      validator: (_rule, value) => checkField('phone', value),
      trigger: 'blur',
    },
  ],
  country_code: [{ required: true, message: 'Required' }],
}

const onFinish = () => {
  emit('submit', { ...formState })
}

defineExpose({
  submit: onFinish,
})
</script>

<style scoped>
@reference "tailwindcss";

:deep(.ant-input),
:deep(.ant-select-selector),
:deep(.ant-input-number) {
  border-radius: var(--radius-base) !important;
}

:deep(.ant-card) {
  border-radius: var(--radius-premium) !important;
  @apply border border-gray-100 dark:border-gray-700 transition-colors duration-300;
  background-color: transparent !important;
}

.dark :deep(.ant-card) {
  background-color: #1f2937 !important;
}
</style>
