<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { routeService } from '@/services/route.service'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { CreditCardOutlined, SettingOutlined, PercentageOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  initialData: Object,
  isEdit: Boolean,
  loading: Boolean,
})

const emit = defineEmits(['submit'])

const authStore = useAuthStore()
const themeStore = useThemeStore()

const dateFormat = computed(() => {
  return authStore.generalSettings?.date_format || 'YYYY-MM-DD'
})

const formRef = ref(null)
const routes = ref([])
const routesLoading = ref(false)

const formState = reactive({
  no_of_rides: 0,
  no_of_valid_days: 0,
  price_per_km: 0,
  discount: 0,
  terms: '<p></p>',
  description: '<p></p>',
  status: true,
})

const rules = {
  no_of_rides: [{ required: true, message: 'Please enter no of rides' }],
  no_of_valid_days: [{ required: true, message: 'Please enter no of valid days' }],
  price_per_km: [{ required: true, message: 'Please enter price per km' }],
  discount: [{ required: true, message: 'Please enter discount value' }],
  terms: [{ required: true, message: 'Please enter terms and conditions' }],
  description: [{ required: true, message: 'Please enter description' }],
}

const fetchRoutes = async () => {
  routesLoading.value = true
  try {
    const response = await routeService.getList()
    routes.value = response.items || response.data?.items || response.data || []
  } catch (error) {
    console.error('Failed to fetch routes', error)
    message.error('Failed to load routes')
  } finally {
    routesLoading.value = false
  }
}

onMounted(async () => {
  await fetchRoutes()
  if (props.initialData) {
    Object.keys(formState).forEach((key) => {
      if (props.initialData[key] !== undefined) {
        if (key === 'start_date' || key === 'end_date') {
          formState[key] = props.initialData[key] ? dayjs(props.initialData[key]) : null
        } else {
          formState[key] = props.initialData[key]
        }
      }
    })
  }
})

const onFinish = () => {
  const payload = {
    ...formState,
  }
  emit('submit', payload)
}
</script>

<template>
  <a-form
    :model="formState"
    layout="vertical"
    @finish="onFinish"
    :rules="rules"
    ref="formRef"
    class="pass-form"
    :class="{ dark: themeStore.isDark }"
  >
    <a-row :gutter="[24, 24]">
      <!-- Left Column: Pass Details -->
      <a-col :xs="24" :lg="12">
        <a-card :bordered="false" class="h-full shadow-sm rounded-2xl overflow-hidden">
          <template #title>
            <div class="flex items-center gap-2">
              <CreditCardOutlined class="text-orange-500" />
              <span>Pass Details</span>
            </div>
          </template>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="No Of Rides" name="no_of_rides">
                <a-input-number
                  v-model:value="formState.no_of_rides"
                  placeholder="e.g. 10"
                  class="w-full"
                  :min="0"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="No Of Valid Days" name="no_of_valid_days">
                <a-input-number
                  v-model:value="formState.no_of_valid_days"
                  placeholder="e.g. 30"
                  class="w-full"
                  :min="0"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Price per KM" name="price_per_km">
                <a-input-number
                  v-model:value="formState.price_per_km"
                  placeholder="0.00"
                  class="w-full"
                  :min="0"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Discount Percentage" name="discount">
                <a-input-number
                  v-model:value="formState.discount"
                  :min="0"
                  :max="100"
                  class="w-full"
                  placeholder="30"
                >
                  <template #addonAfter>
                    <PercentageOutlined />
                  </template>
                </a-input-number>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="Description" name="description" class="mt-4">
            <RichTextEditor
              v-model="formState.description"
              placeholder="Enter pass description..."
              :height="250"
            />
          </a-form-item>
        </a-card>
      </a-col>

      <!-- Right Column: Terms & Status -->
      <a-col :xs="24" :lg="12">
        <a-card :bordered="false" class="h-full shadow-sm rounded-2xl overflow-hidden">
          <template #title>
            <div class="flex items-center gap-2">
              <SettingOutlined class="text-blue-500" />
              <span>Pass Configuration</span>
            </div>
          </template>

          <a-form-item label="Terms and Conditions" name="terms">
            <RichTextEditor
              v-model="formState.terms"
              placeholder="Enter terms and conditions..."
              :height="350"
            />
          </a-form-item>

          <a-form-item label="Pass Status" name="status" class="mb-0">
            <div
              class="flex items-center justify-between p-4 rounded-xl transition-colors duration-300"
              :class="
                themeStore.isDark
                  ? 'bg-gray-800/50 border border-gray-700'
                  : 'bg-gray-50 border border-gray-100'
              "
            >
              <div class="flex flex-col">
                <span
                  class="font-medium"
                  :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-700'"
                >
                  {{ formState.status ? 'Active' : 'Inactive' }}
                </span>
                <span class="text-xs text-gray-500">
                  {{
                    formState.status
                      ? 'Pass will be available for customers'
                      : 'Pass will be hidden from customers'
                  }}
                </span>
              </div>
              <a-switch v-model:checked="formState.status" />
            </div>
          </a-form-item>
        </a-card>
      </a-col>

      <!-- Action Buttons -->
      <a-col :span="24">
        <div class="flex items-center justify-end gap-3 mt-4">
          <a-button
            size="large"
            @click="$router.back()"
            class="px-8 rounded-xl flex items-center gap-2"
          >
            Cancel
          </a-button>
          <a-button
            type="primary"
            size="large"
            html-type="submit"
            :loading="loading"
            class="px-10 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {{ isEdit ? 'Update Pass' : 'Create Pass' }}
          </a-button>
        </div>
      </a-col>
    </a-row>
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
  font-weight: 500;
  @apply text-gray-600;
}

.dark :deep(.ant-form-item-label > label) {
  @apply text-gray-400;
}
</style>
