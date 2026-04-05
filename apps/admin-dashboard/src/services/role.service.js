import api from './api'

export const roleService = {
  getAll(params) {
    return api.get('/roles', { params })
  },

  getSearch(params) {
    return api.get('/roles/search', { params })
  },

  getById(id) {
    return api.get(`/roles/${id}`)
  },

  getList() {
    return api.get('/roles/list')
  },

  create(data) {
    return api.post('/roles', data)
  },

  update(id, data) {
    return api.patch(`/roles/${id}`, data)
  },

  delete(id) {
    return api.delete(`/roles/${id}`)
  },

  changeStatus(id, status) {
    return api.patch(`/roles/${id}/status`, { status })
  },

  transform(rows) {
    return rows.map((item, index) => ({
      ...item,
      key: item.ids || item._id || item.id || index,
      id: item.ids || item._id || item.id,
      displayStatus: item.status,
      name: item.name,
      slug: item.slug,
      permissions_count: item.permissions?.length || 0,
    }))
  },
}
