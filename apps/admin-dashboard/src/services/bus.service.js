import api from './api'
import dayjs from 'dayjs'

export const busService = {
  getAll(params) {
    return api.get('/buses/search', { params })
  },

  getLists() {
    return api.get('/buses/list')
  },

  getById(id) {
    return api.get(`/buses/${id}`)
  },

  create(data) {
    return api.post('/buses', data)
  },

  update(id, data) {
    return api.patch(`/buses/${id}`, data)
  },

  delete(id) {
    return api.delete(`/buses/${id}`)
  },

  load() {
    return api.get('/buses')
  },

  loadByRoute() {
    return api.get('/buses/route')
  },

  isExists(params) {
    return api.post('/buses/is-exists', params)
  },

  transform(rows) {
    return rows.map((item, index) => ({
      key: item.id || item.ids || item._id || index,
      id: item.ids || item._id,
      index: index + 1,
      id: item.ids,
      name: item.name,
      reg_no: item.reg_no,
      chassis_no: item.chassis_no,
      model_no: item.model_no,
      brand: item.brand,
      layout: item.layout,
      type: item.type ? item.type : '',
      created_by: item.created_by ? item.created_by : '',
      max_seats: item.max_seats,
      picture: item.picture,
      amenities: item.amenities,
      bustypeId: item.bustypeId,
      buslayoutId: item.buslayoutId,
      status: item.status,
      certificate_registration: item.certificate_registration,
      certificate_pollution: item.certificate_pollution,
      certificate_insurance: item.certificate_insurance,
      certificate_fitness: item.certificate_fitness,
      certificate_permit: item.certificate_permit,
      createdAt: item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD') : 'N/A',
      picture: item.picture,
    }))
  },
}
