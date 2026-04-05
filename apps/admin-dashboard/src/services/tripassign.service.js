import { formatDate, formatDateTime } from '@/utils/date'
import api from './api'

export const tripAssignService = {
  getAll(params) {
    return api.get('/booking-assigns/search', { params })
  },

  getList(value) {
    return api.get('/booking-assigns/list', { params: { search: value } })
  },

  getById(id) {
    return api.get(`/booking-assigns/${id}`)
  },

  checkAvailability(params) {
    return api.post('/booking-assigns/check-availability', params)
  },

  create(data) {
    return api.post('/booking-assigns', data)
  },

  update(id, data) {
    return api.patch(`/booking-assigns/${id}`, data)
  },

  delete(id) {
    return api.delete(`/booking-assigns/${id}`)
  },

  changeStatus(id, status) {
    return api.patch(`/booking-assigns/${id}/status`, { status })
  },

  getStops(routeId) {
    return api.get(`/booking-assigns/stops/${routeId}`)
  },

  transform(rows) {
    return rows.map((item, index) => ({
      key: item._id || index,
      index: index + 1,
      id: item.ids || item._id,
      vendor_name: item.admin_name,
      route_name: item.route_name,
      driver_name: item.driver_name,
      driver_phone: item.driver_phone,
      driver_picture: item.driver_picture,
      date_time: item.date_time,
      departure_time: item.departure_time,
      arrival_time: item.arrival_time,
      dates: item.dates || [],
      assistantId: item.assistantId,
      assistant_phone: item.assistant_phone,
      assistant_picture: item.assistant_picture,
      status: item.trip_status || item.status,
      createdAt: formatDateTime(item.createdAt),
    }))
  },
}
