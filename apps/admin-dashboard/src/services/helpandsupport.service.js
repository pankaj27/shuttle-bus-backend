import api from './api'
import { formatDateTime } from '@/utils/date'

export const helpAndSupportService = {
  getAll(params) {
    return api.get('/help-and-supports', { params })
  },

  update(id, data) {
    return api.patch(`/help-and-supports/${id}`, data)
  },

  delete(id) {
    return api.delete(`/help-and-supports/${id}`)
  },

  reply(id, data) {
    return api.post(`/help-and-supports/${id}/reply`, data)
  },

  transform(rows) {
    return rows.map((item, index) => ({
      ...item,
      key: item.ids || item._id || item.id || index,
      id: item.ids || item._id || item.id,
      ticket_no: item.ticket_no,
      userId: item.userId,
      fullname: item.fullname,
      email: item.email,
      phone: item.phone,
      subject: item.subject || item.description_short || item.description,
      status: item.status,
      description_short: item.description_short,
      description: item.description,
      createdAtOriginal: item.createdAt,
      createdAt: formatDateTime(item.createdAt),
      replies: item.replies,
      export_replies: (function () {
        if (!item.replies) return ''
        if (Array.isArray(item.replies)) {
          return item.replies
            .map(
              (r) =>
                `[${r.sender || 'Admin'} - ${formatDateTime(r.date || r.createdAt)}]: ${r.message || r.content}`,
            )
            .join(' | ')
        }
        if (typeof item.replies === 'object') {
          return `[${item.replies.title || 'Admin'} - ${formatDateTime(item.replies.createdAt)}]: ${item.replies.content || item.replies.message}`
        }
        return ''
      })(),
    }))
  },
}
