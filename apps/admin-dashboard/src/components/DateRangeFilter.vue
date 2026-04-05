<template>
  <div class="date-range-filter">
    <a-range-picker
      v-model:value="dateRange"
      :format="format"
      :placeholder="['Start Date', 'End Date']"
      allow-clear
      @change="handleDateChange"
      class="w-full md:w-80"
      :presets="rangePresets"
    >
      <template #suffixIcon>
        <LucideIcon name="Calendar" :size="16" class="text-gray-400" />
      </template>
    </a-range-picker>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import dayjs from 'dayjs'

const props = defineProps({
  value: {
    type: Array,
    default: () => [],
  },
  format: {
    type: String,
    default: 'YYYY-MM-DD',
  },
})

const emit = defineEmits(['update:value', 'change'])

const dateRange = ref(props.value)

// Sync with prop changes
watch(
  () => props.value,
  (newVal) => {
    dateRange.value = newVal
  },
)

const handleDateChange = (dates, dateStrings) => {
  emit('update:value', dates)
  emit('change', { dates, dateStrings })
}

const rangePresets = [
  { label: 'Today', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
  { label: 'Yesterday', value: [dayjs().add(-1, 'd').startOf('day'), dayjs().add(-1, 'd').endOf('day')] },
  { label: 'Last 7 Days', value: [dayjs().add(-7, 'd'), dayjs()] },
  { label: 'Last 30 Days', value: [dayjs().add(-30, 'd'), dayjs()] },
  { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
  { label: 'Last Month', value: [dayjs().add(-1, 'month').startOf('month'), dayjs().add(-1, 'month').endOf('month')] },
]
</script>

<style scoped>

</style>
