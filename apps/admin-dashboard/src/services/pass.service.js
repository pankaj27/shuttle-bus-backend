import api from './api'
import dayjs from 'dayjs'

const getDateFormat = () => {
  try {
    const settings = localStorage.getItem('general-settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      return parsed.date_format || 'YYYY-MM-DD'
    }
  } catch (e) {
    // ignore error
  }
  return 'YYYY-MM-DD'
}

export const passService = {
  getAll(params) {
    return api.get('/passes', { params })
  },

  getById(id) {
    return api.get(`/passes/${id}`)
  },

  create(data) {
    return api.post('/passes', data)
  },

  update(id, data) {
    return api.patch(`/passes/${id}`, data)
  },

  delete(id) {
    return api.delete(`/passes/${id}`)
  },

  changeStatus(id, status, type) {
    return api.patch(`/passes/${id}/status`, { status, type })
  },

  isExists(params) {
    return api.post('/passes/is-exists', params)
  },

  transform(rows) {
    return rows.map((item, index) => ({
      key: item.id || index,
      id: item.ids,
      index: index + 1,
      no_of_rides: item.no_of_rides,
      no_of_valid_days: item.no_of_valid_days,
      discount: item.discount,
      description: item.description,
      terms: item.terms,
      price_per_km: item.price_per_km,
      status: item.status, // true/false or active/inactive
    }))
  },
}
