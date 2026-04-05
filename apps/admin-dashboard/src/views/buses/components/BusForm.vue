<template>
  <a-form :model="formState" layout="vertical" ref="formRef" :rules="rules">
    <a-tabs default-active-key="1">
      <!-- General Info Tab -->
      <a-tab-pane key="1" tab="General Info">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a-form-item label="Bus Name" name="name">
            <a-input v-model:value="formState.name" placeholder="e.g. Red Express 101" :disabled="disabled" />
          </a-form-item>

          <a-form-item label="Registration Number" name="reg_no">
            <a-input v-model:value="formState.reg_no" placeholder="e.g. KA-01-AB-1234" :disabled="disabled" />
          </a-form-item>

          <a-form-item label="Brand" name="brand">
            <a-input v-model:value="formState.brand" placeholder="e.g. Volvo" :disabled="disabled" />
          </a-form-item>

          <a-form-item label="Model Number" name="model_no">
            <a-input v-model:value="formState.model_no" placeholder="e.g. B11R" :disabled="disabled" />
          </a-form-item>

          <a-form-item label="Chassis Number" name="chassis_no">
            <a-input v-model:value="formState.chassis_no" placeholder="Enter chassis number" :disabled="disabled" />
          </a-form-item>
        </div>
      </a-tab-pane>

      <!-- Configuration Tab -->
      <a-tab-pane key="2" tab="Configuration">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a-form-item label="Bus Type" name="bustypeId">
            <a-select
              v-model:value="formState.bustypeId"
              placeholder="Select Bus Type"
              :loading="loadingTypes"
              option-filter-prop="label"
              :disabled="disabled"
            >
              <a-select-option
                v-for="type in busTypes"
                :key="type.value"
                :value="type.value"
                :label="type.label"
              >
                {{ type.label }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Bus Layout" name="buslayoutId">
            <a-select
              v-model:value="formState.buslayoutId"
              placeholder="Select Seat Layout"
              :loading="loadingLayouts"
              @change="handleLayoutChange"
              option-filter-prop="label"
              :disabled="disabled"
            >
              <a-select-option
                v-for="layout in busLayouts"
                :key="layout.value"
                :value="layout.value"
                :label="layout.label"
              >
                {{ layout.label }} ({{ layout.max_seats }} seats)
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Max Seats" name="max_seats">
            <a-input-number
              v-model:value="formState.max_seats"
              class="w-full"
              :disabled="true"
              placeholder="Auto-filled from layout"
            />
          </a-form-item>

          <a-form-item label="Status" name="status">
            <div class="flex items-center gap-2 mt-2">

              <a-select v-model:value="formState.status" class="w-full" :disabled="disabled">
                <a-select-option value="Active">Active</a-select-option>
                <a-select-option value="OnRoute">OnRoute</a-select-option>
                <a-select-option value="Idle">Idle</a-select-option>
                <a-select-option value="Maintance">Maintance</a-select-option>
                <a-select-option value="Breakdown">Breakdown</a-select-option>
                <a-select-option value="Inactive">Inactive</a-select-option>
              </a-select>
   
            </div>
          </a-form-item>

          <a-form-item label="Bus Images" name="picture" class="col-span-2">
            <FileUpload 
              v-model:value="formState.picture" 
              folder="buses"
              :multiple="true"
              help-text="Upload multiple bus photos"
              :disabled="disabled"
            />
          </a-form-item>

          <a-form-item label="Amenities" name="amenities" class="col-span-2">
            <a-select
              style="width: 100%"
              placeholder="Please select amenities"
              mode="multiple"
              v-model:value="formState.amenities"
              :options="amenities"
              :disabled="disabled"
            >
            </a-select>
          </a-form-item>
        </div>
      </a-tab-pane>

      <!-- Documents Tab -->
      <a-tab-pane key="3" tab="Documents">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a-form-item label="Registration" name="certificate_registration">
            <FileUpload 
              v-model:value="formState.certificate_registration" 
              folder="buses/documents"
              :max-size="5"
              accept="image/*,application/pdf"
              :disabled="disabled"
            />
          </a-form-item>

          <a-form-item label="Pollution Certificate" name="certificate_pollution">
            <FileUpload 
              v-model:value="formState.certificate_pollution" 
              folder="buses/documents"
              :max-size="5"
              accept="image/*,application/pdf"
              :disabled="disabled"
            />
          </a-form-item>

          <a-form-item label="Insurance" name="certificate_insurance">
            <FileUpload 
              v-model:value="formState.certificate_insurance" 
              folder="buses/documents"
              :max-size="5"
              accept="image/*,application/pdf"
              :disabled="disabled"
            />
          </a-form-item>

          <a-form-item label="Fitness Certificate" name="certificate_fitness">
            <FileUpload 
              v-model:value="formState.certificate_fitness" 
              folder="buses/documents"
              :max-size="5"
              accept="image/*,application/pdf"
              :disabled="disabled"
            />
          </a-form-item>

          <a-form-item label="Permit" name="certificate_permit">
            <FileUpload 
              v-model:value="formState.certificate_permit" 
              folder="buses/documents"
              :max-size="5"
              accept="image/*,application/pdf"
              :disabled="disabled"
            />
          </a-form-item>
        </div>
      </a-tab-pane>
    </a-tabs>
  </a-form>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { bustypeService } from '@/services/bustype.service'
import { buslayoutService } from '@/services/buslayout.service'
import { busService } from '@/services/bus.service'
import FileUpload from '@/components/FileUpload.vue'
import dayjs from 'dayjs'
import { amenities } from '@/constants/amenities'

const props = defineProps({
  record: { type: Object, default: null },
  isEdit: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'cancel'])

const formRef = ref(null)
const busTypes = ref([])
const busLayouts = ref([])
const loadingTypes = ref(false)
const loadingLayouts = ref(false)



const formState = reactive({
  name: '',
  reg_no: '',
  brand: '',
  model_no: '',
  chassis_no: '',
  bustypeId: null, // Bus Type ID
  buslayoutId: null, // Bus Layout ID
  max_seats: 0,
  amenities: [],
  status: 'Active',
  picture:[],
  certificate_registration: '',
  certificate_pollution: '',
  certificate_insurance: '',
  certificate_fitness: '',
  certificate_permit: '',
})

const checkExistence = async (key, value) => {
  if (!value) return Promise.resolve()
  try {
    const payload = {
      [key]: value,
      id: props.isEdit && props.record ? props.record.id || props.record._id : undefined,
    }
    const { status } = await busService.isExists(payload)

    if (status) {
      const label = key === 'reg_no' ? 'Registration number' : key === 'model_no' ? 'Model number' : 'Bus name'
      return Promise.reject(`${label} already exists`)
    }
    return Promise.resolve()
  } catch (error) {
    console.error(error)
    return Promise.resolve()
  }
}

const rules = {
  name: [
    { required: true, message: 'Bus name is required' },
     { validator: (_rule, value) => checkExistence('name', value), trigger: 'blur' },
  ],
  reg_no: [
    { required: true, message: 'Registration number is required' },
    { validator: (_rule, value) => checkExistence('reg_no', value), trigger: 'blur' },
  ],
  model_no: [
    { required: true, message: 'Model number is required' },
     { validator: (_rule, value) => checkExistence('model_no', value), trigger: 'blur' },
  ],
  bustypeId: [{ required: true, message: 'Bus type is required' }],
  buslayoutId: [{ required: true, message: 'Bus layout is required' }],
  max_seats: [{ required: true, message: 'Max seats is required' }],
}

const filterOption = (input, option) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

const fetchData = async () => {
  try {
    loadingTypes.value = true
    loadingLayouts.value = true

    // Fetch Bus Types
    const typesRes = await bustypeService.getList()
    // Some API returns { data: [...] }, others returns raw array
    const rawTypes = typesRes.data || typesRes || []
    busTypes.value = rawTypes

    // Fetch Bus Layouts
    const layoutsRes = await buslayoutService.getList()
    const rawLayouts = layoutsRes.data || layoutsRes || []
    busLayouts.value = rawLayouts
  } catch (error) {
    console.error('Error fetching dropdown data:', error)
  } finally {
    loadingTypes.value = false
    loadingLayouts.value = false
  }
}

const handleLayoutChange = (layoutId) => {
  const selectedLayout = busLayouts.value.find((l) => l.value === layoutId)
  if (selectedLayout) {
    formState.max_seats = selectedLayout.max_seats
  }
}

onMounted(() => {
  fetchData()
})

watch(
  () => props.record,
  (newRecord) => {
    if (newRecord) {
      // Populate form logic
      Object.assign(formState, {
        name: newRecord.name,
        reg_no: newRecord.reg_no,
        brand: newRecord.brand,
        model_no: newRecord.model_no,
        chassis_no: newRecord.chassis_no,
        bustypeId: newRecord.bustypeId || newRecord.type?.id || newRecord.type,
        buslayoutId: newRecord.buslayoutId || newRecord.layout?.id || newRecord.layout,
        max_seats: newRecord.max_seats,
        amenities: newRecord.amenities,
        status: newRecord.status,
        // Date fields - ensure they are formatted string YYYY-MM-DD if null dont set
        certificate_registration: newRecord.certificate_registration || '',
        certificate_pollution: newRecord.certificate_pollution || '',
        certificate_insurance: newRecord.certificate_insurance || '',
        certificate_fitness: newRecord.certificate_fitness || '',
        certificate_permit: newRecord.certificate_permit || '',
      })
    } else {
      // Reset form
      Object.assign(formState, {
        name: '',
        reg_no: '',
        brand: '',
        model_no: '',
        chassis_no: '',
        bustypeId: null,
        buslayoutId: null,
        max_seats: 0,
        amenities: [],
        status: 'Active',
        certificate_registration: '',
        certificate_pollution: '',
        certificate_insurance: '',
        certificate_fitness: '',
        certificate_permit: '',
      })
    }
  },
  { immediate: true },
)

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    emit('submit', { ...formState })
  } catch (error) {
    console.log('Validation Error:', error)
  }
}

defineExpose({
  submit: handleSubmit,
})
</script>
