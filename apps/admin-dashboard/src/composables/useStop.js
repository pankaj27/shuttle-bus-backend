import { ref, reactive, onMounted } from 'vue'
import { stopService } from '@/services/stop.service'
import { message } from 'ant-design-vue'

export function useStop() {
  const loading = ref(false)
  const searchText = ref('')
  const filterStatus = ref(null)
  const activeTab = ref('all')
  const stops = ref([])

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
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Landmark', dataIndex: 'landmark', key: 'landmark' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchStop = async () => {
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
        sortDesc: pagination.sortOrder === 'descend',
        type: activeTab.value,
      }
      const response = await stopService.getAll(params)

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

      stops.value = stopService.transform(items)
      pagination.total = total || items.length || 0
    } catch (error) {
      console.error('API Error:', error)
      message.error('Failed to fetch stops')
      stops.value = []
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

    fetchStop()
  }

  let searchTimeout = null
  const handleSearch = () => {
    pagination.current = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchStop()
    }, 300)
  }

  const refresh = () => {
    pagination.current = 1
    fetchStop()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      await stopService.changeStatus(record.id, val)
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
      await stopService.delete(record.id)
      message.success('Stop deleted successfully')
      fetchStop()
    } catch (error) {
      message.error('Failed to delete stop')
    }
  }

  onMounted(() => {
    fetchStop()
  })

  return {
    loading,
    searchText,
    filterStatus,
    activeTab,
    stops,
    pagination,
    columns,
    refresh,
    handleTabChange: handleSearch,
    createStop: stopService.create,
    updateStop: stopService.update,
    getStopById: stopService.getById,
    handleStatusChange,
    handleTableChange,
    handleDelete,
  }
}
