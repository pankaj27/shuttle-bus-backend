import { ref, reactive, onMounted } from 'vue'
import { offerservice } from '@/services/offer.service'
import { message } from 'ant-design-vue'

export function useOffers() {
  const loading = ref(false)
  const searchText = ref('')
  const filterStatus = ref(null)
  const activeTab = ref('all')
  const offers = ref([])

  const pagination = reactive({
    current: 1,
    pageSize: 10,
    sort: 'createdAt',
    sortOrder: 'descend',
    total: 0,
  })

  // ... (columns definition remains same)
  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Discount', key: 'discount' },
    { title: 'Start Date', dataIndex: 'start_date', key: 'valid_from' },
    { title: 'End Date', dataIndex: 'end_date', key: 'valid_to' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchOffers = async () => {
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
        type: activeTab.value, // Pass custom tab value
      }
      const response = await offerservice.getAll(params)

      // ... (rest of logic)
      const items = response.items || response.data?.items || []
      const total = response.totalRecords || response.data?.total || 0

      if (items.length > 0) {
        offers.value = offerservice.transform(items)
        pagination.total = total
      } else {
        offers.value = []
        pagination.total = 0
      }
    } catch (error) {
      console.error('API Error, using filtered mock data:', error)
      // ... (mock data logic - simplified for update)
      const allMockOffers = [
        {
          id: '1',
          name: 'Welcome Bonus',
          code: 'WELCOME50',
          discount: 50,
          discount_type: 'fixed',
          valid_from: '2025-01-01',
          valid_to: '2025-06-30',
          limit: 100,
          status: true,
        },
        {
          id: '2',
          name: 'Summer Sale',
          code: 'SUMMER20',
          discount: 20,
          discount_type: 'percentage',
          valid_from: '2025-06-01',
          valid_to: '2025-08-31',
          limit: 500,
          status: false,
        },
      ]

      let filtered = allMockOffers
      if (searchText.value) {
        const query = searchText.value.toLowerCase()
        filtered = filtered.filter(
          (d) => d.name.toLowerCase().includes(query) || d.code.toLowerCase().includes(query),
        )
      }

      if (filterStatus.value !== null && filterStatus.value !== undefined) {
        const statusBool = filterStatus.value === 'true'
        filtered = filtered.filter((d) => d.status === statusBool)
      }

      offers.value = offerservice.transform(filtered)
      pagination.total = filtered.length
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag) => {
    pagination.current = pag.current
    fetchOffers()
  }

  let searchTimeout = null
  const handleSearch = () => {
    pagination.current = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchOffers()
    }, 300)
  }

  const refresh = () => {
    fetchOffers()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      console.log('val, record', val, record)
      await offerservice.changeStatus(record.id, val)
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
      await offerservice.delete(record.id)
      message.success('Offer deleted successfully')
      fetchOffers()
    } catch (error) {
      message.error('Failed to delete offer')
    }
  }

  onMounted(() => {
    fetchOffers()
  })

  return {
    loading,
    searchText,
    filterStatus,
    activeTab, // Export activeTab
    offers,
    pagination,
    columns,
    refresh,
    handleTabChange: handleSearch,
    createOffer: offerservice.create,
    updateOffer: offerservice.update,
    getOfferById: offerservice.getById,
    handleStatusChange,
    handleDelete,
  }
}
