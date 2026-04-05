<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { routeService } from '@/services/route.service'
import RichTextEditor from '@/components/RichTextEditor.vue'
import FileUpload from '@/components/FileUpload.vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  initialData: Object,
  isEdit: Boolean,
  loading: Boolean,
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit'])

const authStore = useAuthStore()
const dateFormat = computed(() => {
  return authStore.generalSettings?.date_format || 'YYYY-MM-DD'
})

const formRef = ref(null)
const routes = ref([])
const routesLoading = ref(false)

const formState = reactive({
  name: '',
  code: '',
  start_date: null,
  end_date: null,
  discount: 0,
  attempt: 1, // Usage limit
  type: true,
  routeId: null,
  status: true,
  picture: '',
  terms: '<p></p>',
})

watch(formState, (newValue) => {
  formState.code = newValue.code.toUpperCase()
})

const rules = {
  name: [{ required: true, message: 'Please enter offer name' }],
  code: [{ required: true, message: 'Please enter offer code' }],
  start_date: [{ required: true, message: 'Please select start date' }],
  end_date: [{ required: true, message: 'Please select end date' }],
  discount: [{ required: true, message: 'Please enter discount value' }],
  picture: [{ required: true, message: 'Please upload an image' }],
  terms: [{ required: true, message: 'Please enter terms and conditions' }],
}

const fetchRoutes = async () => {
  routesLoading.value = true
  try {
    const response = await routeService.getList()
    // Adjust based on actual API response structure (items, data, or array)
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
    // Populate form
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
  // formatting dates back to ISO strings or Date objects as required by backend
  // adhering to the user request "ISODate" format implies ISO string
  const payload = {
    ...formState,
    start_date: formState.start_date ? formState.start_date.toISOString() : null,
    end_date: formState.end_date ? formState.end_date.toISOString() : null,
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
    class="offer-form"
  >
    <a-row :gutter="24">
      <!-- Left Column: Basic Info & Settings -->
      <a-col :xs="24" :lg="16">
        <a-card title="Offer Details" :bordered="false" class="mb-6 shadow-sm rounded-2xl">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="Offer Name" name="name">
                <a-input v-model:value="formState.name" placeholder="Summer Sale 2025" :disabled="disabled" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Coupon Code" name="code">
                <a-input v-model:value="formState.code" placeholder="Example: DISCOUNT30" :disabled="disabled">
                  <template #prefix>
                    <span class="text-gray-400 font-bold">#</span>
                  </template>
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="Discount Amount" name="discount">
                <a-input-number
                  v-model:value="formState.discount"
                  :min="0"
                  class="w-full"
                  placeholder="30"
                  :disabled="disabled"
                />
                <span class="text-xs text-gray-400 mt-1 block"
                  >Percentage or Fixed amount based on system logic</span
                >
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Applicable To" name="type">
                <a-radio-group v-model:value="formState.type" button-style="solid" class="w-full" :disabled="disabled">
                  <a-radio-button :value="true" class="w-1/2 text-center"
                    >All Routes</a-radio-button
                  >
                  <a-radio-button :value="false" class="w-1/2 text-center"
                    >Specific Route</a-radio-button
                  >
                </a-radio-group>
              </a-form-item>
            </a-col>
          </a-row>

          <!-- Conditional Route Select -->
          <div v-if="!formState.type" class="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <a-form-item
              label="Select Route"
              name="routeId"
              :rules="[{ required: !formState.type, message: 'Please select a route' }]"
            >
              <a-select
                v-model:value="formState.routeId"
                placeholder="Search and select a route..."
                allowClear
                show-search
                option-filter-prop="label"
                :loading="routesLoading"
                :disabled="disabled"
              >
                <a-select-option
                  v-for="route in routes"
                  :key="route.value"
                  :value="route.value"
                  :label="route.label"
                >
                  <div class="flex flex-col">
                    <span class="font-bold">{{ route.label }}</span>
                    <span class="text-xs text-gray-500">{{ route.totalStops }} Stops</span>
                  </div>
                </a-select-option>
              </a-select>
            </a-form-item>
          </div>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="Valid From" name="start_date">
                <a-date-picker
                  v-model:value="formState.start_date"
                  class="w-full"
                  :format="dateFormat"
                  :disabled="disabled"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Valid Until" name="end_date">
                <a-date-picker
                  v-model:value="formState.end_date"
                  class="w-full"
                  :format="dateFormat"
                  :disabled="disabled"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <a-card title="Terms & Conditions" :bordered="false" class="mb-6 shadow-sm rounded-2xl">
          <a-form-item name="terms" class="mb-0">
            <RichTextEditor
              v-model="formState.terms"
              placeholder="Enter terms and conditions..."
              :height="300"
              :disabled="disabled"
            />
          </a-form-item>
        </a-card>
      </a-col>

      <!-- Right Column: Banner & Status -->
      <a-col :xs="24" :lg="8">
        <a-card title="Offer Image" :bordered="false" class="mb-6 shadow-sm rounded-2xl">
          <a-form-item name="picture" class="mb-0">
            <FileUpload
              v-model:value="formState.picture"
              folder="offers"
              help-text="213x102 px (PNG, JPG < 2MB)"
              height="102"
              width="213"
              :disabled="disabled"
            />
          </a-form-item>
        </a-card>

        <a-card title="Settings" :bordered="false" class="shadow-sm rounded-2xl">
          <a-form-item label="Usage Limit (Attempts)" name="attempt">
            <a-input-number
              v-model:value="formState.attempt"
              :min="1"
              class="w-full"
              placeholder="Total allowed uses"
              :disabled="disabled"
            />
          </a-form-item>

          <a-form-item label="Status" name="status" class="mb-4">
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span class="text-gray-700"
                >{{ formState.status ? 'Active' : 'Inactive' }} Status</span
              >
              <a-switch v-model:checked="formState.status" :disabled="disabled" />
            </div>
          </a-form-item>
        </a-card>

        <div class="mt-6 flex flex-col gap-3">
          <a-button
            v-if="!disabled"
            type="primary"
            size="large"
            html-type="submit"
            :loading="loading"
            class="w-full h-12 text-base font-semibold shadow-lg shadow-blue-200"
          >
            {{ isEdit ? 'Update Offer' : 'Create Offer' }}
          </a-button>
          <a-button size="large" class="w-full h-12" @click="$router.back()">Cancel</a-button>
        </div>
      </a-col>
    </a-row>
  </a-form>
</template>

<style scoped>
/* Scoped styles mainly for specific overrides if Tailwind isn't enough */
</style>
