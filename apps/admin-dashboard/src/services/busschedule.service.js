import { formatDate, formatDateTime } from '@/utils/date'
import api from './api'
import { minutesToDayjs, minutesToTime } from '@/utils/time'

export const busScheduleService = {
  getAll(params) {
    return api.get('/bus-schedules', { params })
  },

  getLists() {
    return api.get('/bus-schedules/list')
  },
  getById(id) {
    return api.get(`/bus-schedules/${id}`)
  },

  create(data) {
    return api.post('/bus-schedules', data)
  },

  update(id, data) {
    return api.patch(`/bus-schedules/${id}`, data)
  },

  delete(id) {
    return api.delete(`/bus-schedules/${id}`)
  },

  changeStatus(id, status) {
    return api.patch(`/bus-schedules/${id}/status`, { status })
  },

  transform(rows) {
    return rows.map((item, index) => ({
      key: item._id || index,
      id: item.ids || item._id,
      index: index + 1,
      routeName: item.route_name,
      routeId: item.routeId,
      busName: item.bus_name,
      busId: item.busId,
      departureTime: minutesToTime(item.depart_time),
      arrivalTime: minutesToTime(item.arrive_time),
      startToEnd: `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`,
      status: item.status,
      createdAt: formatDateTime(item.createdAt),
    }))
  },
}
