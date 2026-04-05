<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import FileUpload from '@/components/FileUpload.vue'
import { customerService } from '@/services/customer.service'
import { driverService } from '@/services/driver.service'
import { useThemeStore } from '@/stores/theme'
import debounce from 'lodash/debounce'

const props = defineProps({
  initialData: { type: Object, default: null },
  isEdit: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'cancel'])
const themeStore = useThemeStore()
const formRef = ref(null)
const userOptions = ref([])
const fetchingUsers = ref(false)

const getDefaultState = () => ({
  to: 'to_all',
  user_type: 'CUSTOMER',
  message_type: 'push',
  title: '',
  content: '',
  user_ids: [],
  schedule: 'immediately',
  time: null,
  days: [],
  picture: '',
  status: true,
})

const formState = reactive(getDefaultState())

const rules = {
  to: [{ required: true, message: 'Please select target audience' }],
  user_type: [{ required: true, message: 'Please select user type' }],
  title: [{ required: true, message: 'Please enter notification title' }],
  content: [
    { required: true, message: 'Please enter message content' },
    { max: 160, message: 'Content cannot exceed 160 characters' }
  ],
  user_ids: [{ 
    validator: async (rule, value) => {
      if (formState.to === 'to_specific' && (!value || value.length === 0)) {
        return Promise.reject('Please select at least one user')
      }
      return Promise.resolve()
    },
    trigger: 'change'
  }]
}

const dayOptions = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
]

const userTypeOptions = [
  { label: 'Customer', value: 'CUSTOMER' },
  { label: 'Driver', value: 'DRIVER' },
]

const targetOptions = [
  { label: 'All Users', value: 'to_all' },
  { label: 'Specific Users', value: 'to_specific' },
]

const scheduleOptions = [
  { label: 'Send Immediately', value: 'immediately' },
  { label: 'Scheduled (Time & Days)', value: 'date' },
]

const fetchUsers = debounce(async (search) => {
  if (!search) return
  fetchingUsers.value = true
  try {
    let response
    if (formState.user_type === 'CUSTOMER') {
      response = await customerService.getSearch(search)
    } else {
      // Assuming driverService has a similar list method or common search
      response = await driverService.getSearch(search)
    }
    const items = response.data?.items || response.items || []
    userOptions.value = items.map(u => ({
      label: `${u.firstname} ${u.lastname} (+${u.country_code} ${u.phone || u.email})`,
      value: u.id || u._id
    }))
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    fetchingUsers.value = false
  }
}, 500)

// Watch initialData to populate or reset form
watch(
  () => props.initialData, 
  (newData) => {
    if (newData) {
      const data = newData
      Object.assign(formState, {
        to: data.to || 'to_all',
        user_type: data.user_type || 'CUSTOMER',
        message_type: data.message_type || 'push',
        title: data.notification_title || data.notification?.title || '',
        content: data.notification_body || data.notification?.body || '',
        user_ids: data.user_ids || [],
        schedule: data.schedule || 'immediately',
        time: data.time || null,
        days: data.days || [],
        picture: data.notification_picture || data.notification?.picture || '',
        status: data.status !== undefined ? data.status : true,
      })
    } else {
      // Reset form to default state
      Object.assign(formState, getDefaultState())
      userOptions.value = []
    }
  },
  { immediate: true }
)

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    // Construct payload in the format expected by notificationService
    const payload = {
      to: formState.to,
      user_type: formState.user_type,
      message_type: formState.message_type,
      schedule: formState.schedule,
      time: formState.time,
      days: formState.days,
      user_ids: formState.to === 'to_specific' ? formState.user_ids : [],
      status: formState.status,
      notification: {
        title: formState.title,
        body: formState.content,
        picture: formState.picture,
      }
    }
    
    emit('submit', payload)
  } catch (error) {
    console.error('Validation failed:', error)
  }
}

const resetForm = () => {
  Object.assign(formState, getDefaultState())
  userOptions.value = []
}

defineExpose({ submit: handleSubmit, reset: resetForm })
</script>

<template>
  <a-form
    ref="formRef"
    :model="formState"
    :rules="rules"
    layout="vertical"
    class="notification-form"
    :class="{ dark: themeStore.isDark }"
  >
    <a-row :gutter="24">
      <!-- Target Audience Section (Full Width Top) -->
      <a-col :span="24">
        <a-card :bordered="false" class="shadow-sm rounded-2xl mb-6 bg-gray-50/30 dark:bg-gray-800/20">
          <template #title>
            <div class="flex items-center gap-2">
              <LucideIcon name="Users" class="text-blue-500" :size="18" />
              <span>Target Audience</span>
            </div>
          </template>
          
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="Send To" name="to">
                <a-radio-group v-model:value="formState.to" button-style="solid" class="w-full flex">
                  <a-radio-button v-for="opt in targetOptions" :key="opt.value" :value="opt.value" class="flex-1 text-center">
                    {{ opt.label }}
                  </a-radio-button>
                </a-radio-group>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="User Type" name="user_type">
                <a-select v-model:value="formState.user_type" :options="userTypeOptions" @change="userOptions = []" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item v-if="formState.to === 'to_specific'" label="Search & Select Users" name="user_ids">
            <a-select
              v-model:value="formState.user_ids"
              mode="multiple"
              placeholder="Search by name, email or phone..."
              :filter-option="false"
              :not-found-content="fetchingUsers ? undefined : 'Type to search users'"
              @search="fetchUsers"
              :options="userOptions"
              class="w-full"
            >
              <template v-if="fetchingUsers" #notFoundContent>
                <a-spin size="small" />
              </template>
            </a-select>
          </a-form-item>
        </a-card>
      </a-col>

      <!-- Left Column: Notification Content -->
      <a-col :xs="24" :lg="12">
        <a-card :bordered="false" class="shadow-sm rounded-2xl mb-6 h-full">
          <template #title>
            <div class="flex items-center gap-2">
              <LucideIcon name="MessageSquare" class="text-indigo-500" :size="18" />
              <span>Notification Content</span>
            </div>
          </template>

          <a-form-item label="Title" name="title">
            <a-input v-model:value="formState.title" placeholder="e.g. Special Weekend Offer!" />
          </a-form-item>

          <a-form-item label="Message Body" name="content">
            <a-textarea 
              v-model:value="formState.content" 
              :rows="4" 
              placeholder="Enter your message here..."
              show-count
              :maxlength="160"
            />
          </a-form-item>

          <a-form-item label="Banner Image (Optional)" name="picture">
            <FileUpload
              v-model:value="formState.picture"
              folder="notifications"
              help-text="Recommended size: 720x480px"
            />
          </a-form-item>
        </a-card>
      </a-col>

      <!-- Right Column: Delivery Schedule -->
      <a-col :xs="24" :lg="12">
        <a-card :bordered="false" class="shadow-sm rounded-2xl mb-6 h-full bg-gray-50/30 dark:bg-gray-800/20">
          <template #title>
            <div class="flex items-center gap-2">
              <LucideIcon name="Calendar" class="text-orange-500" :size="18" />
              <span>Delivery Schedule</span>
            </div>
          </template>

          <a-form-item label="Schedule Type" name="schedule" class="mb-6">
            <a-radio-group v-model:value="formState.schedule" button-style="solid" class="w-full flex">
              <a-radio-button v-for="opt in scheduleOptions" :key="opt.value" :value="opt.value" class="flex-1 text-center">
                {{ opt.label }}
              </a-radio-button>
            </a-radio-group>
          </a-form-item>

          <div v-if="formState.schedule === 'date'" class="space-y-6 pt-2">
           
                <a-form-item label="Delivery Time" name="time">
                  <a-time-picker v-model:value="formState.time" format="HH:mm" value-format="HH:mm" class="w-full" />
                </a-form-item>
           
      <a-form-item label="Repeat on Days" name="days" class="mb-0">
              <a-checkbox-group v-model:value="formState.days" class="w-full">
                <div class="grid grid-cols-7 gap-3">
                  <div v-for="day in dayOptions" :key="day.value" class="flex flex-col items-center p-2 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700">
                    <span class="text-[10px] font-black text-gray-400 mb-1 uppercase">{{ day.label }}</span>
                    <a-checkbox :value="day.value" class="m-0" />
                  </div>
                </div>
              </a-checkbox-group>
            </a-form-item>

       

      
          </div>

          <!-- Quick Tip -->
          <div class="mt-8 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/20">
            <div class="flex gap-3">
              <LucideIcon name="Info" class="text-indigo-500 mt-1" :size="16" />
              <p class="text-[11px] text-indigo-600 dark:text-indigo-400 leading-relaxed m-0">
                Scheduled notifications will be sent automatically based on the selected server time. 
                Instant notifications are dispatched immediately upon submission.
              </p>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </a-form>
</template>

<style scoped>
@reference "tailwindcss";

.notification-form :deep(.ant-card-head) {
  @apply border-b border-gray-100 dark:border-gray-700 min-h-0 py-3 px-5;
}

.notification-form :deep(.ant-card-head-title) {
  @apply text-sm font-bold;
}

.notification-form :deep(.ant-card-body) {
  @apply p-5;
}

.notification-form :deep(.ant-form-item-label > label) {
  @apply text-xs font-bold uppercase tracking-wider text-gray-500;
}
</style>
