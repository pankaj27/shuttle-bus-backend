import { ref, reactive, onMounted } from 'vue'
import { roleService } from '@/services/role.service'
import { message } from 'ant-design-vue'

export function useRole() {
  const loading = ref(false)
  const searchText = ref('')
  const roles = ref([])

  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const columns = [
    { title: 'Role Name', dataIndex: 'name', key: 'name' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug' },
    { title: 'Permissions', key: 'permissions_count', align: 'center' },
    { title: 'Actions', key: 'action', align: 'right' },
  ]

  const fetchRoles = async () => {
    loading.value = true
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText.value,
      }
      const response = await roleService.getAll(params)

      const items = response.data?.items || response.items || []
      const total = response.data?.total || response.totalRecords || 0

      roles.value = roleService.transform(items)
      pagination.total = total
    } catch (error) {
      console.error('Failed to fetch roles:', error)
      // Mock data for fallback
      roles.value = roleService.transform([
        {
          ids: '1',
          name: 'Super Admin',
          slug: 'super-admin',
          description: 'Full system access',
          permissions: ['*'],
          status: true,
        },
        {
          ids: '2',
          name: 'Operation Manager',
          slug: 'manager',
          description: 'Manage daily operations and drivers',
          permissions: ['dashboard.view', 'drivers.view', 'drivers.edit'],
          status: true,
        },
      ])
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag) => {
    pagination.current = pag.current
    fetchRoles()
  }

  const handleSearch = () => {
    pagination.current = 1
    fetchRoles()
  }

  const handleStatusChange = async (val, record) => {
    record.statusLoading = true
    try {
      const response = await roleService.changeStatus(record.id, val)
      message.success(response?.message || `Status updated for ${record.name}`)
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update status'
      message.error(errorMsg)
      record.status = !val
    } finally {
      record.statusLoading = false
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await roleService.delete(id)
      message.success(response?.message || 'Role deleted')
      fetchRoles()
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Delete failed'
      message.error(errorMsg)
    }
  }

  onMounted(fetchRoles)

  return {
    loading,
    searchText,
    roles,
    pagination,
    columns,
    handleTableChange,
    handleSearch,
    handleStatusChange,
    handleDelete,
    refresh: fetchRoles,
  }
}
