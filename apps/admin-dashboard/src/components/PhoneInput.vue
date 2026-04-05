<template>
  <a-input-group compact class="phone-input-group flex w-full">
    <a-select
      v-model:value="selectedCode"
      show-search
      class="country-select"
      placeholder="Code"
      :size="size"
      :filter-option="filterOption"
      option-label-prop="value"
      @change="emitUpdate"
    >
      <template #suffixIcon>
        <LucideIcon name="ChevronDown" :size="14" class="text-gray-400" />
      </template>
      <a-select-option v-for="c in countries" :key="c.value" :value="'+' + c.value" :label="c.label">
        <div class="flex justify-between items-center w-full">
          <span class="font-medium">+{{ c.value }}</span>
          <span class="text-gray-400 text-xs ml-2">{{ c.label }}</span>
        </div>
      </a-select-option>
    </a-select>
    
    <a-input
      v-model:value="phoneNumber"
      class="phone-field"
      placeholder="Enter phone number"
      :size="size"
      @input="emitUpdate"
    />
  </a-input-group>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { countryService } from '@/services/country.service';

const props = defineProps({
  code: {
    type: String,
    default: '91'
  },
  number: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'default'
  }
});

const emit = defineEmits(['update:code', 'update:number']);

const countries = ref([]);
const selectedCode = ref(props.code?.startsWith('+') ? props.code : (props.code ? '+' + props.code : '+91'));
const phoneNumber = ref(props.number);

// Sync with props
watch(() => props.code, (newVal) => {
  if (newVal) {
    const formatted = newVal.startsWith('+') ? newVal : '+' + newVal;
    if (selectedCode.value !== formatted) {
      selectedCode.value = formatted;
    }
  }
});

watch(() => props.number, (newVal) => {
  phoneNumber.value = newVal;
});

onMounted(async () => {
  try {
    const res = await countryService.getList();
    countries.value = res.data || [];
  } catch (e) {
    console.error('Failed to load countries for PhoneInput');
    // Sync fallback with label/value structure
    countries.value = [{ label: 'India', value: '91' }];
  }
});

const filterOption = (input, option) => {
  const label = option.label || '';
  const value = option.value || '';
  const searchStr = input.toLowerCase();
  return label.toLowerCase().includes(searchStr) || value.toLowerCase().includes(searchStr);
};

const emitUpdate = () => {
  const codeWithoutPlus = selectedCode.value ? selectedCode.value.replace('+', '') : '';
  emit('update:code', codeWithoutPlus);
  emit('update:number', phoneNumber.value);
};
</script>

<style scoped>
.phone-input-group {
  box-shadow: none;
  display: flex !important;
}

.country-select {
  width: 170px !important;
  flex-shrink: 0;
}

.phone-field {
  flex: 1;
}

/* Ensure focus and hover borders look clean in the group */
:deep(.ant-input:focus), 
:deep(.ant-select-focused .ant-select-selector) {
  z-index: 2;
}

:deep(.ant-input:hover),
:deep(.ant-select:hover .ant-select-selector) {
  z-index: 1;
}

/* Dark mode tweaks */
.dark :deep(.ant-select-selector),
.dark :deep(.ant-input) {
  background-color: transparent !important;
  border-color: #374151 !important;
  color: white !important;
}

.dark :deep(.ant-select-arrow) {
  color: #9ca3af !important;
}
</style>
