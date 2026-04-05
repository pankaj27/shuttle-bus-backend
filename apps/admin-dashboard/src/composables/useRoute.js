import { ref, reactive, onMounted } from 'vue'
import { routeService } from '@/services/route.service'
import { message } from 'ant-design-vue'

export function useRoute() {
  const loading = ref(false)
  const searchText = ref('')
  const filterStatus = ref(null)
  const activeTab = ref('all')
  const routes = ref([])

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
    { title: 'Total Stops', dataIndex: 'total_stops', key: 'total_stops' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchRoute = async () => {
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
      const response = await routeService.getAll(params)

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

      routes.value = routeService.transform(items)
      pagination.total = total || items.length || 0
    } catch (error) {
      console.error('API Error:', error)
      message.error('Failed to fetch routes')
      routes.value = []
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

    fetchRoute()
  }

  let searchTimeout = null
  const handleSearch = () => {
    pagination.current = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchRoute()
    }, 300)
  }

  const refresh = () => {
    pagination.current = 1
    fetchRoute()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      await routeService.changeStatus(record.id, val)
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
      await routeService.delete(record.id)
      message.success('Route deleted successfully')
      fetchRoute()
    } catch (error) {
      message.error('Failed to delete route')
    }
  }

  const handleCopy = async (record) => {
    const authStore = (await import('@/stores/auth')).useAuthStore()
    if (authStore.isDemo) {
      message.warning('Creating a new route is disabled in Demo Mode.')
      return
    }

    loading.value = true
    try {
      const res = await routeService.getById(record.id)
      const data = res.data || res

      const payload = {
        title: `${data.title} (Copy)`,
        status: data.status,
        stops: data.stops.map((s) => ({
          stopId: s.stopId,
          order: s.order,
          distance: s.distance || 0,
          price_per_km_pickup: s.price_per_km_pickup || 0,
          price_per_km_drop: s.price_per_km_drop || 0,
          minimum_fare_pickup: s.minimum_fare_pickup || 0,
          minimum_fare_drop: s.minimum_fare_drop || 0,
        })),
      }

      await routeService.create(payload)
      message.success('Route copied successfully')
      fetchRoute()
    } catch (error) {
      console.error('Copy Error:', error)
      message.error('Failed to copy route')
    } finally {
      loading.value = false
    }
  }

  const handleCopyReverse = async (record) => {
    const authStore = (await import('@/stores/auth')).useAuthStore()
    if (authStore.isDemo) {
      message.warning('Updating a route is disabled in Demo Mode.')
      return
    }

    loading.value = true
    try {
      const res = await routeService.getById(record.id)
      const data = res.data || res

      const payload = {
        title: data.title,
        status: data.status,
        stops: data.stops
          .slice()
          .reverse()
          .map((s, index) => ({
            id: s.id,
            stopId: s.stopId,
            order: index + 1,
            distance: s.distance || 0,
            price_per_km_pickup: s.price_per_km_pickup || 0,
            price_per_km_drop: s.price_per_km_drop || 0,
            minimum_fare_pickup: s.minimum_fare_pickup || 0,
            minimum_fare_drop: s.minimum_fare_drop || 0,
          })),
      }

      await routeService.update(record.id, payload)
      message.success('Route stops reversed successfully')
      fetchRoute()
    } catch (error) {
      console.error('Reverse Error:', error)
      message.error('Failed to reverse route stops')
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchRoute()
  })

  return {
    loading,
    searchText,
    filterStatus,
    activeTab,
    routes,
    pagination,
    columns,
    refresh,
    handleCopy,
    handleCopyReverse,
    handleTabChange: handleSearch,
    createRoute: routeService.create,
    updateRoute: routeService.update,
    getRouteById: routeService.getById,
    handleStatusChange,
    handleTableChange,
    handleDelete,
  }
}
