import { ref, reactive, onMounted } from 'vue'
import { notificationService } from '@/services/notification.service'
import { message } from 'ant-design-vue'

export function useNotification() {
  const loading = ref(false)
  const searchText = ref('')
  const filterStatus = ref(null)
  const activeTab = ref('all')
  const notifications = ref([])

  const pagination = reactive({
    current: 1,
    pageSize: 10,
    sort: 'createdAt',
    sortOrder: 'descend',
    total: 0,
  })

  // Column definitions for notifications
  const columns = [
    { title: '#', dataIndex: 'index', key: 'index', width: 60 },
    { title: 'Title', dataIndex: 'notification_title', key: 'title' },
    { title: 'To', dataIndex: 'user_type', key: 'user_type' },
    { title: 'Schedule', dataIndex: 'schedule', key: 'schedule' },
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Sent Stats', key: 'send_total', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchNotifications = async () => {
    loading.value = true
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText.value,
        sortBy: pagination.sort,
        sortDesc: pagination.sortOrder,
      }
      const response = await notificationService.getAll(params)

      const items = response.data?.items || response.items || []
      const total = response.data?.total || response.totalRecords || 0

      if (items.length > 0) {
        notifications.value = notificationService.transform(items)
        pagination.total = total
      } else {
        notifications.value = []
        pagination.total = 0
      }
    } catch (error) {
      console.error('API Error, using mock data:', error)
      const allMockNotifications = [
        {
          ids: '1',
          user_type: 'CUSTOMER',
          schedule: 'instant',
          time: '14:30',
          notification: {
            title: 'Welcome to Jadliride!',
            body: 'Enjoy your first ride with a special discount.',
            picture: '',
          },
          status: true,
        },
        {
          ids: '2',
          user_type: 'DRIVER',
          schedule: 'daily',
          time: '09:00',
          notification: {
            title: 'Morning Briefing',
            body: 'Please check your assigned routes for today.',
            picture: '',
          },
          status: true,
        },
      ]

      let filtered = allMockNotifications
      if (searchText.value) {
        const query = searchText.value.toLowerCase()
        filtered = filtered.filter(
          (d) =>
            d.notification.title.toLowerCase().includes(query) ||
            d.notification.body.toLowerCase().includes(query),
        )
      }

      notifications.value = notificationService.transform(filtered)
      pagination.total = filtered.length
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag) => {
    pagination.current = pag.current
    fetchNotifications()
  }

  let searchTimeout = null
  const handleSearch = () => {
    pagination.current = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchNotifications()
    }, 300)
  }

  const refresh = () => {
    fetchNotifications()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      console.log('val, record', val, record)
      await notificationService.changeStatus(record.id, val)
      message.success(`Status updated for ${record.name}`)
      refresh()
    } catch (error) {
      message.error('Failed to update status')
      record.status = !val // Revert
    } finally {
      record.statusLoading = false
    }
  }

  const handleDelete = async (record) => {
    try {
      await notificationService.delete(record.id)
      message.success('Notification deleted successfully')
      fetchNotifications()
    } catch (error) {
      message.error('Failed to delete notification')
    }
  }

  onMounted(() => {
    fetchNotifications()
  })

  return {
    loading,
    searchText,
    filterStatus,
    activeTab, // Export activeTab
    notifications,
    pagination,
    columns,
    refresh,
    handleTabChange: handleSearch,
    createNotification: notificationService.create,
    updateNotification: notificationService.update,
    handleStatusChange,
    handleDelete,
  }
}
