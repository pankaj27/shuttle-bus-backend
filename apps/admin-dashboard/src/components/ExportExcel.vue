<template>
  <a-button
    @click="handleExport"
    size="large"
    class="flex items-center gap-2 rounded-xl border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-all border shadow-sm h-10 px-4 font-bold"
  >
    <LucideIcon name="FileSpreadsheet" :size="18" />
    Export Excel ({{ data.length }})
  </a-button>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { message } from 'ant-design-vue'

// XLSX is now dynamically imported in handleExport to reduce bundle size

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  filename: {
    type: String,
    default: 'export',
  },
})

const getNestedValue = (obj, path) => {
  if (!path) return ''
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || ''
}

const handleExport = async () => {
  try {
    if (!props.data || props.data.length === 0) {
      message.warning('No data to export')
      return
    }

    // Lazy load XLSX
    const XLSX = await import('xlsx')

    // Format data for XLSX: array of objects with header titles as keys
    const exportData = props.data.map((record) => {
      const row = {}
      props.columns.forEach((col) => {
        let value = getNestedValue(record, col.dataIndex)
        if (col.format && typeof col.format === 'function') {
          value = col.format(value, record)
        }
        row[col.title] = value
      })
      return row
    })

    // Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    
    // Create Workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const fullFilename = `${props.filename}-${timestamp}.xlsx`

    // Write file
    XLSX.writeFile(workbook, fullFilename)
    
    message.success('Excel file generated successfully')
  } catch (error) {
    console.error('Export Error:', error)
    message.error('Failed to generate Excel file')
  }
}
</script>
