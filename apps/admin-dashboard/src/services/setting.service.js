import api from './api'

export const settingService = {
  async fetch(site) {
    try {
      const response = await api.get(`settings/${site}`)
      return response
    } catch (e) {
      return e.response
    }
  },
  async update(site, data) {
    try {
      const response = await api.patch(`settings/${site}`, data)
      return response
    } catch (e) {
      return e.response
    }
  },
}
