import api from './api'

export const buslayoutService = {
  getAll(params) {
    return api.get('/bus-layouts', { params })
  },

  getList() {
    return api.get('/bus-layouts/list')
  },

  create(data) {
    return api.post('/bus-layouts', data)
  },

  update(id, data) {
    return api.patch(`/bus-layouts/${id}`, data)
  },

  delete(id) {
    return api.delete(`/bus-layouts/${id}`)
  },

  changeStatus(id, status, type) {
    return api.patch(`/bus-layouts/${id}/status`, { status, type })
  },

  isExists(params) {
    return api.post('/bus-layouts/is-exists', params)
  },

  transform(rows) {
    return rows.map((item, index) => ({
      key: item.id || item.ids || item._id || index,
      id: item.ids || item._id,
      index: index + 1,
      name: item.name,
      max_seats: item.max_seats,
      layout: item.layout,
      seat_numbers: item.seat_numbers,
      combine_seats: item.combine_seats,
      status: item.status,
    }))
  },
}
