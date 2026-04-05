import { ref, reactive, onMounted } from 'vue'
import { bookingService } from '@/services/booking.service'
import { message } from 'ant-design-vue'
import { formatDate } from '@/utils/date'

export function useBooking() {
  const loading = ref(false)
  const searchText = ref('')
  const filterStatus = ref(null)
  const activeTab = ref('all')
  const bookings = ref([])

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
    { title: 'PNR No', dataIndex: 'pnr_no', key: 'pnr_no' },
    { title: 'Customer', key: 'customer' },
    { title: 'Route Name', key: 'route_name' },
    { title: 'Date/Time', key: 'start_date', align: 'center' },
    { title: 'Bus Details', key: 'bus' },
    { title: 'Seat(s)', dataIndex: 'seat_nos', key: 'seat_nos' },
    { title: 'Is Pass', dataIndex: 'is_pass', key: 'is_pass', align: 'right' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const exportColumns = [
    { title: 'PNR No', dataIndex: 'pnr_no' },
    { title: 'Customer Name', dataIndex: 'customer_name' },
    { title: 'Customer Phone', dataIndex: 'customer_phone' },
    { title: 'Route Name', dataIndex: 'route_name' },
    { title: 'Booking Date', dataIndex: 'start_date', format: (val) => formatDate(val) },
    { title: 'Start Time', dataIndex: 'start_time' },
    { title: 'Drop Time', dataIndex: 'drop_time' },
    { title: 'Bus Name', dataIndex: 'bus_name' },
    { title: 'Bus Model', dataIndex: 'bus_model_no' },
    { title: 'Is Pass', dataIndex: 'is_pass' },
    { title: 'No Of Pass', dataIndex: 'no_of_pass' },
    { title: 'Fare', dataIndex: 'amount' },
    {
      title: 'Seats',
      dataIndex: 'seat_nos',
      format: (val) => (Array.isArray(val) ? val.join(', ') : val),
    },
    { title: 'Travel Status', dataIndex: 'travel_status' },
    { title: 'Payment Status', dataIndex: 'payment_status' },
  ]

  const dateRange = ref([])

  const fetchBooking = async () => {
    loading.value = true
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText.value,
        travel_status: activeTab.value === 'all' ? null : activeTab.value,
        sortBy: pagination.sort,
        sortDesc: pagination.sortOrder === 'descend' ? 'desc' : 'asc',
      }

      if (dateRange.value && dateRange.value.length === 2) {
        params.startDate = dateRange.value[0]
        params.endDate = dateRange.value[1]
      }

      const response = await bookingService.getAll(params)

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

      bookings.value = bookingService.transform(items)
      pagination.total = total || items.length || 0
    } catch (error) {
      console.error('API Error:', error)
      message.error('Failed to fetch bookings')
      bookings.value = []
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

    fetchBooking()
  }

  let searchTimeout = null
  const handleSearch = () => {
    pagination.current = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchBooking()
    }, 300)
  }

  const refresh = () => {
    pagination.current = 1
    fetchBooking()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      await bookingService.update(record.id, { status: val })
      message.success(`Status updated for ${record.title || record.ticket_no}`)
      record.status = val
    } catch (error) {
      message.error('Failed to update status')
    } finally {
      record.statusLoading = false
    }
  }

  const handleDelete = async (id) => {
    try {
      // await bookingService.delete(id)
      message.success('Booking deleted successfully')
      fetchBooking()
    } catch (error) {
      message.error('Failed to delete booking')
    }
  }

  onMounted(() => {
    fetchBooking()
  })

  return {
    loading,
    searchText,
    filterStatus,
    activeTab,
    bookings,
    pagination,
    columns,
    refresh,
    handleTabChange: handleSearch,
    handleSearch,
    dateRange,
    updateBooking: bookingService.update,
    getBookingById: bookingService.getById,
    handleStatusChange,
    handleTableChange,
    handleDelete,
    exportColumns,
  }
}
