import { ref, reactive, onMounted } from 'vue'
import { busService } from '@/services/bus.service'
import { message } from 'ant-design-vue'

export function useBus() {
  const loading = ref(false)
  const searchText = ref('')
  const filterStatus = ref(null)
  const activeTab = ref('all')
  const bus = ref([])

  const pagination = reactive({
    current: 1,
    pageSize: 10,
    sort: 'createdAt',
    sortOrder: 'desc',
    total: 0,
  })

  // ... (columns definition remains same)
  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Layout', dataIndex: 'layout', key: 'layout' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Max Seats', dataIndex: 'max_seats', key: 'max_seats' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchBus = async () => {
    loading.value = true
    try {
      // Map activeTab to status for API if needed, or rely on 'type' key
      // Map activeTab to status for API if needed, or rely on 'type' key
      if (activeTab.value === 'Active') filterStatus.value = 'true'
      else if (activeTab.value === 'Inactive') filterStatus.value = 'false'
      else filterStatus.value = null

      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText.value,
        status: filterStatus.value,
        sortBy: pagination.sort,
        sortDesc: pagination.sortOrder,
        type: activeTab.value, // Bus custom tab value
      }
      const response = await busService.getAll(params)

      // ... (rest of logic)
      const items = response.items || response.data?.items || []
      const total = response.totalRecords || response.data?.total || 0

      if (items.length > 0) {
        bus.value = busService.transform(items)
        pagination.total = total
      } else {
        bus.value = []
        pagination.total = 0
      }
    } catch (error) {
      console.error('API Error, using filtered mock data:', error)
      const allMockBuss = [
        {
          id: '1',
          name: 'AC Sleeper',
          status: true,
        },
        {
          id: '2',
          name: 'Non-AC Seater',
          status: false,
        },
      ]

      let filtered = allMockBuss
      if (searchText.value) {
        const query = searchText.value.toLowerCase()
        filtered = filtered.filter((d) => d.name.toLowerCase().includes(query))
      }

      if (filterStatus.value !== null && filterStatus.value !== undefined) {
        const statusBool = filterStatus.value === 'true'
        filtered = filtered.filter((d) => d.status === statusBool)
      }

      bus.value = busService.transform(filtered)
      pagination.total = filtered.length
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag) => {
    pagination.current = pag.current
    fetchBus()
  }

  let searchTimeout = null
  const handleSearch = () => {
    pagination.current = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchBus()
    }, 300)
  }

  const refresh = () => {
    fetchBus()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      console.log('val, record', val, record)
      await busService.changeStatus(record.id, val)
      message.success(`Status updated for ${record.name}`)
      refresh()
    } catch (error) {
      message.error('Failed to update status')
      record.status = !val // Revert
    } finally {
      record.statusLoading = false
    }
  }

  const handleDelete = async (id) => {
    try {
      await busService.delete(id)
      message.success('Bus deleted successfully')
      fetchBus()
    } catch (error) {
      message.error('Failed to delete Bus')
    }
  }

  onMounted(() => {
    fetchBus()
  })

  return {
    loading,
    searchText,
    filterStatus,
    activeTab, // Export activeTab
    bus,
    pagination,
    columns,
    refresh,
    handleTabChange: handleSearch,
    createBus: busService.create,
    updateBus: busService.update,
    getBusById: busService.getById,
    handleStatusChange,
    handleDelete,
  }
}
