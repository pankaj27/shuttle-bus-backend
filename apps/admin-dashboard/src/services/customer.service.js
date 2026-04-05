import api from './api'
import { formatDateTime } from '@/utils/date'

export const customerService = {
  getAll(params) {
    return api.get('/users', { params })
  },

  getAllReferrals(params) {
    return api.get('/referrals', { params })
  },

  getAllSuggestions(params) {
    return api.get('/suggestions', { params })
  },
  getSearch(params) {
    return api.get(`/users/q?search=${params}`)
  },

  getById(id) {
    return api.get(`/users/${id}`)
  },

  isExists(params) {
    return api.post('/users/is-exists', params)
  },

  create(data) {
    return api.post('/users', data)
  },

  update(id, data) {
    return api.patch(`/users/${id}`, data)
  },

  delete(id) {
    return api.delete(`/users/${id}`)
  },

  permanentlyDelete(id) {
    return api.delete(`/users/${id}/permanently-delete`)
  },

  changeStatus(id, status) {
    return api.patch(`/users/${id}/status`, { status })
  },

  rechargeWallet(data) {
    return api.post('/wallets', data)
  },

  getWalletHistory(userId, params) {
    return api.get(`/users/${userId}/wallet-histories`, { params })
  },

  getBookingHistory(userId, params) {
    return api.get(`/bookings/histories/${userId}`, { params })
  },

  transform(rows) {
    return rows.map((item, index) => ({
      ...item,
      key: item.ids || item._id || item.id || index,
      id: item.ids || item._id || item.id,
      wallet_balance: item.wallet_balance,
      firstname: item.firstname,
      lastname: item.lastname,
      picture: item.picture,
      email: item.email,
      phone: item.phone,
      country_code: item.country_code,
      fullname: `${item.firstname || ''} ${item.lastname || ''}`.trim(),
      displayStatus: item.status ? 'Active' : 'Inactive',
      createdAt: formatDateTime(item.createdAt),
    }))
  },
}
