import api from './api'

export const notificationService = {
  getAll(params) {
    return api.get('/notifications', { params })
  },

  create(data) {
    return api.post('/notifications', data)
  },

  update(id, data) {
    return api.patch(`/notifications/${id}`, data)
  },

  delete(id) {
    return api.delete(`/notifications/${id}`)
  },

  changeStatus(id, status) {
    return api.patch(`/notifications/${id}/status`, { status })
  },

  transform(rows) {
    return rows.map((item, index) => ({
      key: item.id || index,
      id: item.ids,
      index: index + 1,
      to: item.to,
      user_type: item.user_type,
      days: item.days,
      time: item.time,
      schedule: item.schedule,
      notification_title: item.notification.title,
      notification_body: item.notification.body,
      notification_picture: item.notification.picture,
      send_total: item.send_total || { success_count: 0, failed_count: 0 },
    }))
  },
}
