import api from './api'
import dayjs from 'dayjs'

export const routeService = {
  getAll(params) {
    return api.get('/routes/search', { params })
  },

  getList(value) {
    return api.get('/routes/list', { params: { search: value } })
  },

  getById(id) {
    return api.get(`/routes/${id}`)
  },

  create(data) {
    return api.post('/routes', data)
  },

  update(id, data) {
    return api.patch(`/routes/${id}`, data)
  },

  delete(id) {
    return api.delete(`/routes/${id}`)
  },

  changeStatus(id, status) {
    return api.patch(`/routes/${id}/status`, { status })
  },

  getStops(routeId) {
    return api.get(`/routes/stops/${routeId}`)
  },

  transform(rows) {
    return rows.map((item, index) => ({
      key: item._id || index,
      index: index + 1,
      id: item.ids,
      title: item.title,
      total_stops: item.total_stops,
      status: item.status,
      createdAt: item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A',
    }))
  },
}
