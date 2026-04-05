import { ref, reactive, onMounted } from 'vue'
import { driverService } from '@/services/driver.service'
import { message } from 'ant-design-vue'

export function useDrivers(shouldFetch = true) {
  const loading = ref(false)
  const searchText = ref('')
  const filterStatus = ref(null)
  const dateRange = ref([])
  const drivers = ref([])

  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    sort: 'createdAt',
    sortOrder: 'descend',
  })

  const columns = [
    { title: 'Driver Info', key: 'name', width: '25%' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Added On', dataIndex: 'createdAt', key: 'createdAt' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchDrivers = async () => {
    loading.value = true
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText.value,
        sortBy: pagination.sort,
        sortDesc: pagination.sortOrder === 'descend' ? 'desc' : 'asc',
        status: filterStatus.value,
        startDate: dateRange.value?.length ? dateRange.value[0].format('YYYY-MM-DD') : null,
        endDate: dateRange.value?.length ? dateRange.value[1].format('YYYY-MM-DD') : null,
      }
      const response = await driverService.getAll(params)

      // Check if response has items directly or inside data
      const items = response.items || response.data?.items || []
      const total = response.totalRecords || response.data?.total || 0

      if (items.length > 0) {
        drivers.value = driverService.transform(items)
        pagination.total = total
      } else {
        drivers.value = []
        pagination.total = 0
      }
    } catch (error) {
      console.error('API Error, using filtered mock data:', error)

      // Fallback Mock data for visual inspection
      const allMockDrivers = [
        {
          key: '1',
          name: 'John Doe',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          type: 'driver',
          status: true,
          createdAt: new Date(),
        },
        {
          key: '2',
          name: 'Jane Smith',
          firstname: 'Jane',
          lastname: 'Smith',
          email: 'jane@example.com',
          phone: '+0987654321',
          type: 'assistant',
          status: false,
          createdAt: new Date(),
        },
      ]

      // Filter mock data locally for demo purposes
      let filtered = allMockDrivers
      if (searchText.value) {
        const query = searchText.value.toLowerCase()
        filtered = filtered.filter(
          (d) =>
            d.name.toLowerCase().includes(query) ||
            d.email.toLowerCase().includes(query) ||
            d.phone.includes(query),
        )
      }

      if (filterStatus.value !== null && filterStatus.value !== undefined) {
        const statusBool = filterStatus.value === 'true'
        filtered = filtered.filter((d) => d.status === statusBool)
      }

      drivers.value = driverService.transform(filtered)
      pagination.total = filtered.length
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag) => {
    pagination.current = pag.current
    fetchDrivers()
  }

  let searchTimeout = null
  const handleSearch = () => {
    pagination.current = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchDrivers()
    }, 300)
  }

  const refresh = () => {
    fetchDrivers()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      await driverService.changeStatus(record.id, val, record.type)
      message.success(`Status updated for ${record.name}`)
    } catch (error) {
      message.error('Failed to update status')
      record.status = !val // Revert
    } finally {
      record.statusLoading = false
    }
  }

  const handleDelete = async (record) => {
    try {
      await driverService.delete(record.id)
      message.success('Driver deleted successfully')
      fetchDrivers()
    } catch (error) {
      message.error('Failed to delete driver')
    }
  }

  const checkExistence = async (key, value, id) => {
    if (!value) return Promise.resolve()
    try {
      const payload = {
        [key]: value,
        id: id,
      }
      const { status } = await driverService.isExists(payload)

      if (status) {
        return Promise.reject(
          `${key === 'national_id' ? 'National ID' : key.charAt(0).toUpperCase() + key.slice(1)} already exists`,
        )
      }
      return Promise.resolve()
    } catch (error) {
      console.error(error)
      return Promise.resolve()
    }
  }

  onMounted(() => {
    if (shouldFetch) {
      fetchDrivers()
    }
  })

  return {
    loading,
    searchText,
    filterStatus,
    dateRange,
    drivers,
    pagination,
    columns,
    fetchDrivers,
    handleTableChange,
    handleSearch,
    handleDateRangeChange: handleSearch,
    handleStatusChange,
    handleDelete,
    refresh,
    checkExistence,
  }
}
