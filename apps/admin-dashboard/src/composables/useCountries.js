import { ref, reactive, onMounted } from 'vue'
import { countryService } from '@/services/country.service'
import { message } from 'ant-design-vue'

export function useCountries() {
  const loading = ref(false)
  const searchText = ref('')
  const countries = ref([])

  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const columns = [
    { title: 'Country Name', dataIndex: 'name', key: 'name' },
    { title: 'Short Name', dataIndex: 'short_name', key: 'short_name' },
    { title: 'Phone Code', dataIndex: 'phone_code', key: 'phone_code' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchCountries = async () => {
    loading.value = true
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText.value,
      }
      const response = await countryService.getAll(params)

      const items = response.data?.items || response.items || []
      const total = response.data?.total || response.totalRecords || 0

      countries.value = countryService.transform(items)
      pagination.total = total
    } catch (error) {
      console.error('Failed to fetch countries:', error)
      // Mock data for fallback
      countries.value = countryService.transform([
        {
          id: '1',
          name: 'India',
          short_name: 'INR',
          phone_code: '91',
          status: true,
        },
        {
          id: '2',
          name: 'Kenya',
          short_name: 'KES',
          phone_code: '254',
          status: true,
        },
      ])
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag) => {
    pagination.current = pag.current
    fetchCountries()
  }

  const handleSearch = () => {
    pagination.current = 1
    fetchCountries()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      const response = await countryService.changeStatus(record.id, val)
      message.success(response?.message || `Status updated for ${record.name}`)
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
      const response = await countryService.delete(id)
      message.success(response?.message || 'Country deleted')
      fetchCountries()
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Delete failed'
      message.error(errorMsg)
    }
  }

  onMounted(fetchCountries)

  return {
    loading,
    searchText,
    countries,
    pagination,
    columns,
    handleTableChange,
    handleSearch,
    handleStatusChange,
    handleDelete,
    refresh: fetchCountries,
  }
}
