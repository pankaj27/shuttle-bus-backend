import { ref, reactive, onMounted } from 'vue'
import { buslayoutService } from '@/services/buslayout.service'
import { message } from 'ant-design-vue'

export function useBusLayout() {
  const loading = ref(false)
  const searchText = ref('')
  const filterStatus = ref(null)
  const activeTab = ref('all')
  const buslayout = ref([])

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
    { title: 'Total Seats', dataIndex: 'max_seats', key: 'max_seats' },
    { title: 'Layout', dataIndex: 'layout', key: 'layout' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchBusLayout = async () => {
    loading.value = true
    try {
      // Map activeTab to status for API if needed, or rely on 'type' key
      // Map activeTab to status for API if needed, or rely on 'type' key
      if (activeTab.value === 'active') filterStatus.value = 'true'
      else if (activeTab.value === 'inactive') filterStatus.value = 'false'
      else filterStatus.value = null

      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText.value,
        status: filterStatus.value,
        sortBy: pagination.sort,
        sortDesc: pagination.sortOrder,
        type: activeTab.value, // BusLayout custom tab value
      }
      const response = await buslayoutService.getAll(params)

      // ... (rest of logic)
      const items = response.items || response.data?.items || []
      const total = response.totalRecords || response.data?.total || 0

      if (items.length > 0) {
        buslayout.value = buslayoutService.transform(items)
        pagination.total = total
      } else {
        buslayout.value = []
        pagination.total = 0
      }
    } catch (error) {
      console.error('API Error, using filtered mock data:', error)
      const allMockBusLayouts = [
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

      let filtered = allMockBusLayouts
      if (searchText.value) {
        const query = searchText.value.toLowerCase()
        filtered = filtered.filter((d) => d.name.toLowerCase().includes(query))
      }

      if (filterStatus.value !== null && filterStatus.value !== undefined) {
        const statusBool = filterStatus.value === 'true'
        filtered = filtered.filter((d) => d.status === statusBool)
      }

      buslayout.value = buslayoutService.transform(filtered)
      pagination.total = filtered.length
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag) => {
    pagination.current = pag.current
    fetchBusLayout()
  }

  let searchTimeout = null
  const handleSearch = () => {
    pagination.current = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchBusLayout()
    }, 300)
  }

  const refresh = () => {
    fetchBusLayout()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      console.log('val, record', val, record)
      await buslayoutService.changeStatus(record.id, val)
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
      await buslayoutService.delete(id)
      message.success('BusLayout deleted successfully')
      fetchBusLayout()
    } catch (error) {
      message.error('Failed to delete BusLayout')
    }
  }

  onMounted(() => {
    fetchBusLayout()
  })

  return {
    loading,
    searchText,
    filterStatus,
    activeTab, // Export activeTab
    buslayout,
    pagination,
    columns,
    refresh,
    handleTabChange: handleSearch,
    handleSearch,
    createBusLayout: buslayoutService.create,
    updateBusLayout: buslayoutService.update,
    getBusLayoutById: buslayoutService.getById,
    handleStatusChange,
    handleDelete,
  }
}
