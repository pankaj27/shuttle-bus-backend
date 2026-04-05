import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL

export const mapService = {
  mapData(duty_status, search = '') {
    return axios.get(`${BASE_URL}/maps/stream`, {
      params: {
        duty_status,
        search,
        token: localStorage.getItem('accessToken'),
      },
    })
  },

  getStream(duty_status, search = '') {
    const token = localStorage.getItem('accessToken')
    const url = `${BASE_URL}/maps/stream?duty_status=${duty_status}&search=${search}&token=${token}`
    return new EventSource(url)
  },
}
