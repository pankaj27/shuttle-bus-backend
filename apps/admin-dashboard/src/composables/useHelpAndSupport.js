import { ref, reactive, onMounted } from 'vue'
import { helpAndSupportService } from '@/services/helpandsupport.service'
import { message } from 'ant-design-vue'

export function useHelpAndSupport() {
  const loading = ref(false)
  const searchText = ref('')
  const filterStatus = ref(null)
  const activeTab = ref('all')
  const helpAndSupports = ref([])

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
    { title: 'Ticket No', dataIndex: 'ticket_no', key: 'ticket_no' },
    { title: 'Fullname', dataIndex: 'fullname', key: 'fullname' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Message', dataIndex: 'description_short', key: 'description_short' },
    { title: 'Actions', key: 'action', align: 'center' },
  ]

  const fetchHelpAndSupport = async () => {
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
      const response = await helpAndSupportService.getAll(params)

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

      helpAndSupports.value = helpAndSupportService.transform(items)
      pagination.total = total || items.length || 0
    } catch (error) {
      console.error('API Error:', error)
      message.error('Failed to fetch stops')
      helpAndSupports.value = []
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

    fetchHelpAndSupport()
  }

  let searchTimeout = null
  const handleSearch = () => {
    pagination.current = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchHelpAndSupport()
    }, 300)
  }

  const refresh = () => {
    pagination.current = 1
    fetchHelpAndSupport()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      await helpAndSupportService.update(record.id, { status: val })
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
      await helpAndSupportService.delete(id)
      message.success('Help and support deleted successfully')
      fetchHelpAndSupport()
    } catch (error) {
      message.error('Failed to delete help and support')
    }
  }

  onMounted(() => {
    fetchHelpAndSupport()
  })

  return {
    loading,
    searchText,
    filterStatus,
    activeTab,
    helpAndSupports,
    pagination,
    columns,
    refresh,
    handleTabChange: handleSearch,
    updateHelpAndSupport: helpAndSupportService.update,
    getHelpAndSupportById: helpAndSupportService.getById,
    handleStatusChange,
    handleTableChange,
    handleDelete,
  }
}
