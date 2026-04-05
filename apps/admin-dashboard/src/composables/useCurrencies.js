import { ref, reactive, onMounted } from 'vue'
import { currencyService } from '@/services/currency.service'
import { message } from 'ant-design-vue'

export function useCurrencies() {
  const loading = ref(false)
  const searchText = ref('')
  const currencies = ref([])

  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const columns = [
    { title: 'Currency Name', dataIndex: 'name', key: 'name' },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchCurrencies = async () => {
    loading.value = true
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
        search: searchText.value,
      }
      const response = await currencyService.getAll(params)

      const items = response.data?.items || response.items || []
      const total = response.data?.total || response.totalRecords || 0

      currencies.value = currencyService.transform(items)
      pagination.total = total
    } catch (error) {
      console.error('Failed to fetch currencies:', error)
      // Mock data for fallback
      currencies.value = currencyService.transform([
        {
          id: '1',
          name: 'India',
          code: 'INR',
          symbol: '91',
          status: true,
        },
        {
          id: '2',
          name: 'Kenya',
          code: 'KES',
          symbol: '254',
          status: true,
        },
      ])
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag) => {
    pagination.current = pag.current
    fetchCurrencies()
  }

  const handleSearch = () => {
    pagination.current = 1
    fetchCurrencies()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      const response = await currencyService.changeStatus(record.id, val)
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
      const response = await currencyService.delete(id)
      message.success(response?.message || 'Currency deleted')
      fetchCurrencies()
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Delete failed'
      message.error(errorMsg)
    }
  }

  onMounted(fetchCurrencies)

  return {
    loading,
    searchText,
    currencies,
    pagination,
    columns,
    handleTableChange,
    handleSearch,
    handleStatusChange,
    handleDelete,
    refresh: fetchCurrencies,
  }
}
