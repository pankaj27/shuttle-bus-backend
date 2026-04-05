import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const BASE_URL = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for API calls
let isRefreshing = false
let requestsQueue = []

const processQueue = (error, token = null) => {
  requestsQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  requestsQueue = []
}

api.interceptors.request.use(
  async (config) => {
    const authStore = useAuthStore()
    let token = authStore.token

    if (token) {
      // Check validation locally if possible (e.g. check expiration date) or rely on 401 response
      // But typically refresh token logic is best handled in response interceptor on 401 error code.
      // However, if we want to handle BEFORE request:
      // const now = Date.now() / 1000
      // if (authStore.expiresIn && authStore.expiresIn < now) { ... }
    }

    // For now, attaching token as normal.
    // The previous edit instructions implied handling refresh logic.
    // Usually refresh logic is done via response interceptor (catch 401 -> refresh -> retry)
    // OR request interceptor (check expiry -> refresh -> proceed).
    // Given the prompt "in auth.js i have also save refreshtoken could update api.js to h andlle",
    // I will implement the standard Response Interceptor Refresh Flow below instead of here.

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    const originalRequest = error.config
    const authStore = useAuthStore()
    if (error.response?.status === 401) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          requestsQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = authStore.refreshToken

      if (refreshToken) {
        try {
          // Assuming authStore has a refresh method or we call API directly
          // For now, let's assume authStore exposes an action or we use axios directly to avoid circular dep if authStore uses api.js
          // Ideally: await authStore.refreshTheToken()

          // Using a direct axios call to avoid interceptor loop for the refresh call itself
          const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {
            refreshToken,
            email: authStore.user.email,
          })

          if (data.status && data.token.accessToken) {
            authStore.token = data.token.accessToken
            authStore.setToken(data.token) // update token
            authStore.setProfile(data.user)
            // authStore.refreshToken handled in auth.js logic as per request

            api.defaults.headers.common['Authorization'] =
              data.token.tokenType + ' ' + data.token.accessToken
            originalRequest.headers['Authorization'] =
              data.token.tokenType + ' ' + data.token.accessToken

            processQueue(null, data.token.accessToken)
            isRefreshing = false

            return api(originalRequest)
          }
        } catch (refreshError) {
          processQueue(refreshError, null)
          isRefreshing = false
          authStore.logout()
          if (window.location.pathname !== '/#/auth/login') {
            window.location.href = '/#/auth/login'
          }
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token available
        authStore.logout()
        if (window.location.pathname !== '/#/auth/login') {
          window.location.href = '/#/auth/login'
        }
      }
    }

    return Promise.reject(error)
  },
)

export default api
