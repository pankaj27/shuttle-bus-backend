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

export const stopService = {
  getAll(params) {
    return api.get('/stops', { params })
  },

  fetchStop(val) {
    return api.get(`/stops/load?search=${val}`)
  },

  getById(id) {
    return api.get(`/stops/${id}`)
  },

  create(data) {
    return api.post('/stops', data)
  },

  update(id, data) {
    return api.patch(`/stops/${id}`, data)
  },

  delete(id) {
    return api.delete(`/stops/${id}`)
  },

  changeStatus(id, status, type) {
    return api.patch(`/stops/${id}/status`, { status, type })
  },

  isExists(params) {
    return api.post('/stops/is-exists', params)
  },

  transform(rows) {
    if (!rows) return []
    return rows.map((item, index) => ({
      key: item.ids || item._id || item.value || index,
      id: item.ids || item._id || item.value,
      index: index + 1,
      title: item.title || item.label,
      landmark: item.landmark,
      lat: item.lat,
      lng: item.lng,
      type: item.type,
      files: item.files,
      status: item.status,
    }))
  },
}
