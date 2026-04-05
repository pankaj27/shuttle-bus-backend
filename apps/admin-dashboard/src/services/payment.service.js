import { formatDateTime } from '@/utils/date'
import api from './api'

export const paymentService = {
  getAll(params) {
    return api.get('/payments/search', { params })
  },

  transform(rows) {
    return rows.map((item, index) => ({
      ...item,
      key: item.ids || item._id || item.id || index,
      id: item.ids || item._id || item.id,
      pnr_no: item.pnr_no,
      customer_name: item.customer_name,
      customer_phone: item.customer_phone,
      orderId: item.orderId,
      paymentId: item.paymentId,
      amount: item.amount,
      refund_amount: item.refund_amount,
      method: item.method,
      is_pass: item.is_pass,
      payment_status: item.payment_status,
      createdAt: formatDateTime(item.createdAt),
    }))
  },
}
