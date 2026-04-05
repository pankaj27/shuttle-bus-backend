import api from './api'

export const dashboardService = {
  getStats() {
    return api.get('/dashboard/stats')
  },

  getRidershipAnalytics(type = 'week') {
    return api.get('/dashboard/ridership-analytics', { params: { type } })
  },

  getRevenueAnalytics(type = 'week') {
    return api.get('/dashboard/revenue-analytics', { params: { type } })
  },

  getRoutePerformance() {
    return api.get('/dashboard/route-performance')
  },
}
