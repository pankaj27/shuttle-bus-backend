import { ref, reactive, onMounted } from 'vue'
import { bustypeService } from '@/services/bustype.service'
import { message } from 'ant-design-vue'

export function useBusType() {
  const loading = ref(false)
  const searchText = ref('')
  const filterStatus = ref(null)
  const activeTab = ref('all')
  const bustype = ref([])

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
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchBusType = async () => {
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
        type: activeTab.value, // BusType custom tab value
      }
      const response = await bustypeService.getAll(params)

      // ... (rest of logic)
      const items = response.items || response.data?.items || []
      const total = response.totalRecords || response.data?.total || 0

      if (items.length > 0) {
        bustype.value = bustypeService.transform(items)
        pagination.total = total
      } else {
        bustype.value = []
        pagination.total = 0
      }
    } catch (error) {
      console.error('API Error, using filtered mock data:', error)
      const allMockBusTypes = [
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

      let filtered = allMockBusTypes
      if (searchText.value) {
        const query = searchText.value.toLowerCase()
        filtered = filtered.filter((d) => d.name.toLowerCase().includes(query))
      }

      if (filterStatus.value !== null && filterStatus.value !== undefined) {
        const statusBool = filterStatus.value === 'true'
        filtered = filtered.filter((d) => d.status === statusBool)
      }

      bustype.value = bustypeService.transform(filtered)
      pagination.total = filtered.length
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag) => {
    pagination.current = pag.current
    fetchBusType()
  }

  let searchTimeout = null
  const handleSearch = () => {
    pagination.current = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchBusType()
    }, 300)
  }

  const refresh = () => {
    fetchBusType()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      console.log('val, record', val, record)
      await bustypeService.changeStatus(record.id, val)
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
      await bustypeService.delete(id)
      message.success('BusType deleted successfully')
      fetchBusType()
    } catch (error) {
      message.error('Failed to delete BusType')
    }
  }

  onMounted(() => {
    fetchBusType()
  })

  return {
    loading,
    searchText,
    filterStatus,
    activeTab, // Export activeTab
    bustype,
    pagination,
    columns,
    refresh,
    handleTabChange: handleSearch,
    createBusType: bustypeService.create,
    updateBusType: bustypeService.update,
    getBusTypeById: bustypeService.getById,
    handleStatusChange,
    handleDelete,
  }
}
