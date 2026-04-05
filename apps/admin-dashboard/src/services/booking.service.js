import { formatDateTime } from '@/utils/date'
import api from './api'

export const bookingService = {
  getAll(params) {
    return api.get('/bookings/search', { params })
  },

  updateStatus(id, status) {
    return api.post(`/bookings/${id}/status`, { status })
  },

  downloadInvoice(pnr_no) {
    return api.get(`/bookings/${pnr_no}/download-invoice`, { responseType: 'blob' })
  },

  transform(rows) {
    return rows.map((item, index) => ({
      ...item,
      key: item.ids || item._id || item.id || index,
      id: item.ids || item._id || item.id,
      pnr_no: item.pnr_no,
      has_return: item.has_return ? 'Yes' : 'No',
      customer_name: item.customer_name,
      customer_phone: item.customer_phone,
      customer_email: item.customer_email,
      customer_gender: item.customer_gender,
      stopping_points: item.stopping_points,
      distance: item.distance,
      passengers: item.passengers,
      bus_name: item.bus_name,
      bus_model_no: item.bus_model_no,
      seat_nos: item.seat_nos,
      tax_amount: item.tax_amount,
      tax: item.tax,
      fee: item.fee,
      amount: item.amount,
      orderId: item.orderId,
      travel_status: item.travel_status,
      payment_status: item.payment_status,
      payment_created: formatDateTime(item.payment_created),
    }))
  },
}
