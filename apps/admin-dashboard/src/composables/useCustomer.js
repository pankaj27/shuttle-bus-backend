import { ref, reactive, onMounted } from 'vue'
import { customerService } from '@/services/customer.service'
import { message } from 'ant-design-vue'

export function useCustomer() {
  const loading = ref(false)
  const searchText = ref('')
  const filterStatus = ref(null)
  const activeTab = ref('all')
  const dateRange = ref([])
  const customers = ref([])

  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    sort: 'createdAt',
    sortOrder: 'descend',
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
  })

  const columns = [
    { title: 'FullName', dataIndex: 'firstname', key: 'firstname' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Gender', dataIndex: 'gender', key: 'gender' },
    { title: 'Wallet Balance', dataIndex: 'wallet_balance', key: 'wallet_balance' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Added On', dataIndex: 'createdAt', key: 'createdAt', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchCustomer = async () => {
    loading.value = true
    try {
      if (activeTab.value === 'active') filterStatus.value = 'true'
      else if (activeTab.value === 'inactive') filterStatus.value = 'false'
      else filterStatus.value = null

      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText.value,
        status: filterStatus.value,
        sortBy: pagination.sort,
        sortDesc: pagination.sortOrder === 'descend' ? 'desc' : 'asc',
        type: activeTab.value,
        is_deleted: activeTab.value === 'deleted',
        startDate: dateRange.value?.length ? dateRange.value[0].format('YYYY-MM-DD') : null,
        endDate: dateRange.value?.length ? dateRange.value[1].format('YYYY-MM-DD') : null,
      }
      const response = await customerService.getAll(params)

      const items =
        response.items ||
        response.data?.items ||
        (Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [])

      const total =
        response.totalRecords ||
        response.total ||
        response.data?.total ||
        response.data?.totalRecords ||
        (Array.isArray(response) ? response.length : items.length)

      customers.value = customerService.transform(items)
      pagination.total = total || items.length || 0
    } catch (error) {
      console.error('API Error:', error)
      message.error('Failed to fetch customers')
      customers.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag, filters, sorter) => {
    pagination.current = pag.current
    pagination.pageSize = pag.pageSize

    if (sorter.field) {
      pagination.sort = sorter.field
      pagination.sortOrder = sorter.order
    }

    fetchCustomer()
  }

  let searchTimeout = null
  const handleSearch = () => {
    pagination.current = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchCustomer()
    }, 300)
  }

  const refresh = () => {
    pagination.current = 1
    fetchCustomer()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      await customerService.changeStatus(record.id, val)
      message.success(`Status updated for ${record.fullname}`)
      record.status = val
    } catch (error) {
      message.error('Failed to update status')
    } finally {
      record.statusLoading = false
    }
  }

  const handleDelete = async (record) => {
    try {
      await customerService.delete(record.id)
      message.success('Customer deleted successfully')
      fetchCustomer()
    } catch (error) {
      message.error('Failed to delete customer')
    }
  }

  const handlePermanentlyDelete = async (record) => {
    try {
      await customerService.permanentlyDelete(record.id)
      message.success('Customer deleted successfully')
      fetchCustomer()
    } catch (error) {
      message.error('Failed to delete customer')
    }
  }

  const checkExistence = async (key, value, id) => {
    if (!value) return Promise.resolve()
    try {
      const payload = {
        [key]: value,
        id: id,
      }
      const { status } = await customerService.isExists(payload)

      if (status) {
        return Promise.reject(`${key.charAt(0).toUpperCase() + key.slice(1)} already exists`)
      }
      return Promise.resolve()
    } catch (error) {
      console.error(error)
      return Promise.resolve()
    }
  }

  onMounted(() => {
    fetchCustomer()
  })

  return {
    loading,
    searchText,
    filterStatus,
    activeTab,
    dateRange,
    customers,
    pagination,
    columns,
    refresh,
    checkExistence,
    handleTabChange: handleSearch,
    handleDateRangeChange: handleSearch,
    createCustomer: customerService.create,
    updateCustomer: customerService.update,
    getCustomerById: customerService.getById,
    handleStatusChange,
    handleTableChange,
    handleDelete,
    handlePermanentlyDelete,
    handleSearch,
  }
}
