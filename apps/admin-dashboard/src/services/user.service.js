import api from './api'
import { formatDateTime } from '@/utils/date'

export const userService = {
  getAll(params) {
    return api.get('/admins', { params })
  },

  getById(id) {
    return api.get(`/admins/${id}`)
  },

  logout(id) {
    return api.get(`/admins/${id}/logout`)
  },

  changePassword(id, data) {
    return api.post(`/admins/${id}/change-password`, data)
  },

  create(data) {
    return api.post('/admins', data)
  },

  update(id, data) {
    return api.patch(`/admins/${id}`, data)
  },

  delete(id) {
    return api.delete(`/admins/${id}`)
  },

  changeStatus(id, status, type) {
    return api.patch(`/admins/${id}/status`, { status, type })
  },

  isExists(params) {
    return api.post('/admins/is-exists', params)
  },

  transform(rows) {
    return rows.map((item, index) => ({
      key: item.ids || index,
      id: item.ids,
      index: index + 1,
      profile_picture: item.picture,
      firstname: item.firstname,
      lastname: item.lastname,
      email: item.email,
      password: item.password,
      phone: item.phone,
      city: item.city,
      role: item.role,
      address_1: item.address_1,
      address_2: item.address_2,
      pincode: item.pincode,
      status: item.is_active,
      last_login: formatDateTime(item.last_login),
      displayStatus: item.is_active ? 'Active' : 'Inactive',
      createdAt: formatDateTime(item.createdAt),
    }))
  },
}
