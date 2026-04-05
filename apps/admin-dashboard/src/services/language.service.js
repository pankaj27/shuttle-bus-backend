import api from './api'

export const languageService = {
  getAll(params) {
    return api.get('/languages', { params })
  },

  getSearch(params) {
    return api.get('/languages/search', { params })
  },

  getList() {
    return api.get('/languages/list')
  },

  create(data) {
    return api.post('/languages', data)
  },

  update(id, data) {
    return api.patch(`/languages/${id}`, data)
  },

  delete(id) {
    return api.delete(`/languages/${id}`)
  },

  changeStatus(id, status) {
    return api.patch(`/languages/${id}/status`, { status })
  },

  transform(rows) {
    return rows.map((item, index) => ({
      ...item,
      key: item.ids || item._id || item.id || index,
      id: item.ids || item._id || item.id,
      displayStatus: item.status ? 'Active' : 'Inactive',
    }))
  },
}
