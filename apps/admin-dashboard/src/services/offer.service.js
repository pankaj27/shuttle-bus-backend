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

export const offerservice = {
  getAll(params) {
    return api.get('/offers', { params })
  },

  getById(id) {
    return api.get(`/offers/${id}`)
  },

  create(data) {
    return api.post('/offers', data)
  },

  update(id, data) {
    return api.patch(`/offers/${id}`, data)
  },

  delete(id) {
    return api.delete(`/offers/${id}`)
  },

  changeStatus(id, status, type) {
    return api.patch(`/offers/${id}/status`, { status, type })
  },

  isExists(params) {
    return api.post('/offers/is-exists', params)
  },

  transform(rows) {
    return rows.map((item, index) => ({
      key: item.id || index,
      id: item.ids,
      index: index + 1,
      name: item.name,
      code: item.code,
      discount: item.discount,
      discount_type: item.discount_type, // 'percentage' or 'fixed'
      start_date: item.start_date
        ? dayjs(item.start_date).format(getDateFormat())
        : item.valid_from
          ? dayjs(item.valid_from).format(getDateFormat())
          : '-',
      end_date: item.end_date
        ? dayjs(item.end_date).format(getDateFormat())
        : item.valid_to
          ? dayjs(item.valid_to).format(getDateFormat())
          : '-',
      limit: item.attempt || item.limit,
      status: item.status, // true/false or active/inactive
    }))
  },
}
