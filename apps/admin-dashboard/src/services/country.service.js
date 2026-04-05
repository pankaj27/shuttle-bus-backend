import api from './api'

export const countryService = {
  getAll(params) {
    return api.get('/countries', { params })
  },

  getSearch(params) {
    return api.get('/countries/search', { params })
  },

  getList() {
    return api.get('/countries/list')
  },

  create(data) {
    return api.post('/countries', data)
  },

  update(id, data) {
    return api.patch(`/countries/${id}`, data)
  },

  delete(id) {
    return api.delete(`/countries/${id}`)
  },

  changeStatus(id, status) {
    return api.patch(`/countries/${id}/status`, { status })
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
