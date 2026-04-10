import api from './api'

export const paymentGatewayService = {
  async fetch() {
    try {
      const response = await api.get(`payment-gateways`)
      return response
    } catch (e) {
      return e.response?.data || { status: false, message: e.message }
    }
  },

  async update(site, params) {
    try {
      const response = await api.patch(`payment-gateways/${site}`, params)
      return response
    } catch (e) {
      return e.response?.data || { status: false, message: e.message }
    }
  },

  async isEnabled(site) {
    try {
      const response = await api.get(`payment-gateways/is-enabled/${site}`)
      return response
    } catch (e) {
      return e.response?.data || { status: false, message: e.message }
    }
  },
}
