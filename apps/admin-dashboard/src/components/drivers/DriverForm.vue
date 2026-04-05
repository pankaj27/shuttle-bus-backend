<template>
  <a-form
    :model="formState"
    layout="vertical"
    @finish="onFinish"
    :rules="rules"
    ref="formRef"
  >
    <a-row :gutter="24">
      <!-- Account Information -->
      <a-col :xs="24" :lg="12">
        <a-card title="Personal Information" :bordered="false" class="mb-6 shadow-sm">
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

          <a-form-item label="Email Address" name="email">
            <a-input v-model:value="formState.email" placeholder="email@example.com" :disabled="disabled" />
          </a-form-item>

          <a-form-item label="Mobile Contact" name="phone">
            <PhoneInput 
              v-model:code="formState.country_code" 
              v-model:number="formState.phone" 
              :disabled="disabled"
            />
          </a-form-item>

          <a-form-item label="National ID" name="national_id">
            <a-input v-model:value="formState.national_id" placeholder="Enter national ID number" :disabled="disabled" />
          </a-form-item>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="Type" name="type">
                <a-radio-group v-model:value="formState.type" button-style="solid" :disabled="disabled">
                  <a-radio-button value="driver">Driver</a-radio-button>
                  <a-radio-button value="assistant">Assistant</a-radio-button>
                </a-radio-group>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Status" name="status">
                <a-segmented v-model:value="formState.status" :options="['Active', 'Inactive']" :disabled="disabled" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>
      </a-col>

      <!-- Document Uploads -->
      <a-col :xs="24" :lg="12">
        <a-card title="Documents & Photos" :bordered="false" class="shadow-sm">
          <div class="space-y-6">
            <!-- Profile Photo -->
            <div class="doc-upload-item">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Picture</label>
              <FileUpload 
                v-model:value="formState.picture"
                folder="drivers"
                width="128px"
                height="128px"
                helpText="Max 2MB"
                :disabled="disabled"
              />
            </div>

            <!-- License (Only for drivers) -->
            <div v-if="formState.type === 'driver'" class="doc-upload-item">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Driving License</label>
              <FileUpload 
                v-model:value="formState.document_licence"
                folder="driver-docs"
                height="120px"
                :disabled="disabled"
              />
            </div>

            <!-- National ID Card -->
            <div class="doc-upload-item">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">National ID Card</label>
              <FileUpload 
                v-model:value="formState.document_national_icard"
                folder="driver-docs"
                height="120px"
                :disabled="disabled"
              />
            </div>

            <!-- Police Verification -->
            <div class="doc-upload-item">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Police Verification Document</label>
              <FileUpload 
                v-model:value="formState.document_police_vertification"
                folder="driver-docs"
                height="120px"
                :disabled="disabled"
              />
            </div>
          </div>
        </a-card>

        <div v-if="!hideActions" class="mt-8 flex justify-end gap-4">
          <a-button size="large" @click="$router.back()">Cancel</a-button>
          <a-button type="primary" size="large" html-type="submit" :loading="loading">
            {{ isEdit ? 'Update Driver' : 'Register Driver' }}
          </a-button>
        </div>
      </a-col>
    </a-row>
  </a-form>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import PhoneInput from '@/components/PhoneInput.vue';
import FileUpload from '@/components/FileUpload.vue';
import { driverService } from '@/services/driver.service';
import { useDrivers } from '@/composables/useDrivers';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();

const props = defineProps({
  isEdit: Boolean,
  loading: Boolean,
  initialData: Object,
  disabled: Boolean,
  hideActions: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit']);

const formRef = ref(null);

const formState = reactive({
  firstname: '',
  lastname: '',
  email: '',
  country_code: '91',
  phone: '',
  national_id: '',
  type: 'driver',
  status: 'Active',
  picture: '',
  document_licence: '',
  document_national_icard: '',
  document_police_vertification: '',
});

const fileLists = reactive({
  licence: [],
  idCard: [],
  police: [],
});

// Initialize form if editing
onMounted(async () => {
  if (props.initialData) {
    Object.assign(formState, props.initialData);
  }
});

const { checkExistence } = useDrivers(false);

const checkField = (key, value) => {
  const id = props.isEdit && props.initialData ? (props.initialData.id || props.initialData._id) : undefined;
  return checkExistence(key, value, id);
};

const rules = {
  firstname: [{ required: true, message: 'Required' }],
  lastname: [{ required: true, message: 'Required' }],
  email: [
    { required: true, type: 'email', message: 'Valid email required' },
    {
      validator: (_rule, value) => checkField('email', value),
      trigger: 'blur',
    }
  ],
  phone: [
    { required: true, message: 'Required' },
    {
      validator: (_rule, value) => checkField('phone', value),
      trigger: 'blur',
    }
  ],
  country_code: [{ required: true, message: 'Required' }],
  national_id: [
    { required: true, message: 'Required' },
    {
      validator: (_rule, value) => checkField('national_id', value),
      trigger: 'blur',
    }
  ],
};

const onFinish = () => {
  emit('submit', { ...formState });
};

defineExpose({
  submit: onFinish,
})
</script>

<style scoped>
@reference "tailwindcss";

.avatar-uploader :deep(.ant-upload) {
  width: 128px;
  height: 128px;
}
.doc-upload-item {
  @apply p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700;
}

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
