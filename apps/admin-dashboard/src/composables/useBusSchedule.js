import { ref, reactive, onMounted } from 'vue'
import { busScheduleService } from '@/services/busschedule.service'
import { message } from 'ant-design-vue'

export function useBusSchedule() {
  const loading = ref(false)
  const searchText = ref('')
  const filterStatus = ref(null)
  const activeTab = ref('all')
  const busSchedules = ref([])

  const pagination = reactive({
    current: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'descend',
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
  })

  const columns = [
    { title: 'Route', dataIndex: 'routeName', key: 'routeName' },
    { title: 'Bus', dataIndex: 'busName', key: 'busName' },
    { title: 'Departure', dataIndex: 'departureTime', key: 'departureTime' },
    { title: 'Arrival', dataIndex: 'arrivalTime', key: 'arrivalTime' },
    { title: 'Operations', dataIndex: 'startToEnd', key: 'startToEnd' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchBusSchedule = async () => {
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
        sortBy: pagination.sortBy,
        sortDesc: pagination.sortOrder === 'descend' ? 'desc' : 'asc',
        type: activeTab.value,
      }
      const response = await busScheduleService.getAll(params)

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

      busSchedules.value = busScheduleService.transform(items)
      pagination.total = total || items.length || 0
    } catch (error) {
      console.error('API Error:', error)
      message.error('Failed to fetch bus schedules')
      busSchedules.value = []
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

    fetchBusSchedule()
  }

  let searchTimeout = null
  const handleSearch = () => {
    pagination.current = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchBusSchedule()
    }, 300)
  }

  const refresh = () => {
    pagination.current = 1
    fetchBusSchedule()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      await busScheduleService.changeStatus(record.id, val)
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
      await busScheduleService.delete(record.id)
      message.success('Route deleted successfully')
      fetchBusSchedule()
    } catch (error) {
      message.error('Failed to delete route')
    }
  }

  const handleCopy = async (record) => {
    const authStore = (await import('@/stores/auth')).useAuthStore()
    if (authStore.isDemo) {
      message.warning('Creating a new schedule is disabled in Demo Mode.')
      return
    }

    loading.value = true
    try {
      const res = await busScheduleService.getById(record.id)
      const data = res.data || res

      const payload = {
        routeId: data.routeId,
        busId: data.busId,
        every: data.every,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status,
        stops: data.stops.map((s) => ({
          stopId: s.stopId,
          arrival_time: s.arrival_time,
          departure_time: s.departure_time,
          order: s.order,
        })),
      }

      await busScheduleService.create(payload)
      message.success('Schedule copied successfully')
      fetchBusSchedule()
    } catch (error) {
      console.error('Copy Error:', error)
      message.error('Failed to copy schedule')
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchBusSchedule()
  })

  return {
    loading,
    searchText,
    filterStatus,
    activeTab,
    busSchedules,
    pagination,
    columns,
    refresh,
    handleSearch,
    handleCopy,
    handleTabChange: handleSearch,
    createBusSchedule: busScheduleService.create,
    updateBusSchedule: busScheduleService.update,
    getBusScheduleById: busScheduleService.getById,
    handleStatusChange,
    handleTableChange,
    handleDelete,
  }
}
