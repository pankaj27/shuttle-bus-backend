import { ref, reactive, onMounted } from 'vue'
import { tripAssignService } from '@/services/tripassign.service'
import { message } from 'ant-design-vue'

export function useTripAssign() {
  const loading = ref(false)
  const searchText = ref('')
  const filterStatus = ref(null)
  const activeTab = ref('all')
  const tripAssigns = ref([])

  const pagination = reactive({
    current: 1,
    pageSize: 10,
    sort: 'createdAt',
    sortOrder: 'descend',
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
  })

  const columns = [
    { title: 'Route', key: 'route_name', dataIndex: 'route_name' },
    { title: 'Driver', key: 'driver_name', dataIndex: 'driver_name' },
    { title: 'Assistant', key: 'assistantId', dataIndex: 'assistantId' },
    { title: 'Dates', key: 'dates' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchTripAssign = async () => {
    loading.value = true
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText.value,
        status: activeTab.value === 'all' ? null : activeTab.value,
        sortBy: pagination.sort,
        sortDesc: pagination.sortOrder === 'descend',
        type: activeTab.value,
      }
      const response = await tripAssignService.getAll(params)

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

      tripAssigns.value = tripAssignService.transform(items)
      pagination.total = total || items.length || 0
    } catch (error) {
      console.error('API Error:', error)
      message.error('Failed to fetch trip assigns')
      tripAssigns.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag, filters, sorter) => {
    pagination.current = pag.current
    pagination.pageSize = pag.pageSize

    if (sorter.field) {
      pagination.sortBy = sorter.field
      pagination.sortDesc = sorter.order === 'ascend' ? 'ascend' : 'descend'
    }

    fetchTripAssign()
  }

  let searchTimeout = null
  const handleSearch = () => {
    pagination.current = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchTripAssign()
    }, 300)
  }

  const refresh = () => {
    pagination.current = 1
    fetchTripAssign()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      await tripAssignService.changeStatus(record.id, val)
      message.success(`Status updated for ${record.title}`)
      record.status = val
    } catch (error) {
      message.error('Failed to update status')
    } finally {
      record.statusLoading = false
    }
  }

  const handleDelete = async (record) => {
    try {
      await tripAssignService.delete(record.id)
      message.success('Trip assignment deleted successfully')
      fetchTripAssign()
    } catch (error) {
      message.error('Failed to delete trip assignment')
    }
  }

  onMounted(() => {
    fetchTripAssign()
  })

  return {
    loading,
    searchText,
    filterStatus,
    activeTab,
    tripAssigns,
    pagination,
    columns,
    refresh,
    handleTabChange: handleSearch,
    createTripAssign: tripAssignService.create,
    updateTripAssign: tripAssignService.update,
    getTripAssignById: tripAssignService.getById,
    handleStatusChange,
    handleTableChange,
    handleDelete,
  }
}
