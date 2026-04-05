import api from './api'
import { formatDateTime } from '@/utils/date'

export const driverService = {
  getAll(params) {
    return api.get('/drivers', { params })
  },

  isExists(params) {
    return api.post('/drivers/is-exists', params)
  },

  getById(id) {
    return api.get(`/drivers/${id}`)
  },

  getSearch(params) {
    return api.get(`/drivers/q?search=${params}`)
  },

  getList(params) {
    return api.get('/drivers/q', { params })
  },

  create(data) {
    return api.post('/drivers', data)
  },

  update(id, data) {
    return api.patch(`/drivers/${id}`, data)
  },

  delete(id) {
    return api.delete(`/drivers/${id}`)
  },

  changeStatus(id, status, type) {
    return api.patch(`/drivers/${id}/status`, { status, type })
  },

  transform(rows) {
    return rows.map((item, index) => ({
      key: item.ids || index,
      id: item.ids,
      index: index + 1,
      name: `${item.firstname} ${item.lastname}`,
      email: item.email,
      phone: item.phone,
      type: item.type,
      status: item.status,
      createdAt: formatDateTime(item.createdAt),
      picture: item.picture,
    }))
  },
}
