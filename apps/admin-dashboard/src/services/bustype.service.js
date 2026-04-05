import api from './api'

export const bustypeService = {
  getAll(params) {
    return api.get('/bustypes', { params })
  },

  getList() {
    return api.get('/bustypes/list')
  },

  create(data) {
    return api.post('/bustypes', data)
  },

  update(id, data) {
    return api.patch(`/bustypes/${id}`, data)
  },

  delete(id) {
    return api.delete(`/bustypes/${id}`)
  },

  changeStatus(id, status, type) {
    return api.patch(`/bustypes/${id}/status`, { status, type })
  },

  isExists(params) {
    return api.post('/bustypes/is-exists', params)
  },

  transform(rows) {
    return rows.map((item, index) => ({
      key: item.id || index,
      id: item.ids,
      index: index + 1,
      name: item.name,
      status: item.status, // true/false or active/inactive
    }))
  },
}
