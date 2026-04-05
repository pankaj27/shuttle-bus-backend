import api from './api'

export const currencyService = {
  getAll(params) {
    return api.get('/currencies', { params })
  },

  getSearch(params) {
    return api.get('/currencies/search', { params })
  },

  getList() {
    return api.get('/currencies/list')
  },

  create(data) {
    return api.post('/currencies', data)
  },

  update(id, data) {
    return api.patch(`/currencies/${id}`, data)
  },

  delete(id) {
    return api.delete(`/currencies/${id}`)
  },

  changeStatus(id, status) {
    return api.patch(`/currencies/${id}/status`, { status })
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
