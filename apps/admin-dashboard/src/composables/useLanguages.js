import { ref, reactive, onMounted } from 'vue'
import { languageService } from '@/services/language.service'
import { message } from 'ant-design-vue'

export function useLanguages() {
  const loading = ref(false)
  const searchText = ref('')
  const languages = ref([])

  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const columns = [
    { title: 'Language Name', dataIndex: 'label', key: 'label' },
    { title: 'Language Code', dataIndex: 'code', key: 'code' },
    { title: 'Country', dataIndex: 'country_name', key: 'country_name' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchLanguages = async () => {
    loading.value = true
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText.value,
      }
      const response = await languageService.getAll(params)

      const items = response.data?.items || response.items || []
      const total = response.data?.total || response.totalRecords || 0

      languages.value = languageService.transform(items)
      pagination.total = total
    } catch (error) {
      console.error('Failed to fetch languages:', error)
      languages.value = []
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag) => {
    pagination.current = pag.current
    fetchLanguages()
  }

  const handleSearch = () => {
    pagination.current = 1
    fetchLanguages()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      const response = await languageService.changeStatus(record.id, val)
      message.success(response?.message || `Status updated for ${record.label}`)
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update status'
      message.error(errorMsg)
      record.status = !val
    } finally {
      record.statusLoading = false
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await languageService.delete(id)
      message.success(response?.message || 'Language deleted')
      fetchLanguages()
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Delete failed'
      message.error(errorMsg)
    }
  }

  onMounted(fetchLanguages)

  return {
    loading,
    searchText,
    languages,
    pagination,
    columns,
    handleTableChange,
    handleSearch,
    handleStatusChange,
    handleDelete,
    refresh: fetchLanguages,
  }
}
