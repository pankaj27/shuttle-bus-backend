import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { useAuthStore } from '@/stores/auth'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * Formats a date string or object based on the general settings in the auth store.
 * @param {string|Date|dayjs.Dayjs} date - The date to format
 * @param {string} [fallbackFormat='YYYY-MM-DD'] - Default format if no setting is found
 * @returns {string} Formatted date string
 */
export const formatDate = (date, fallbackFormat = 'YYYY-MM-DD') => {
  if (!date) return ''

  const authStore = useAuthStore()
  const format = authStore.generalSettings?.date_format || fallbackFormat
  const tz = authStore.generalSettings?.timezone || 'UTC'

  return dayjs(date).tz(tz).format(format)
}

/**
 * Formats a time string or object based on the general settings in the auth store.
 * @param {string|Date|dayjs.Dayjs} date - The time to format
 * @param {string} [fallbackFormat='HH:mm'] - Default format if no setting is found
 * @returns {string} Formatted time string
 */
export const formatTime = (date, fallbackFormat = 'HH:mm') => {
  if (!date) return ''

  const authStore = useAuthStore()
  const format = authStore.generalSettings?.time_format || fallbackFormat
  const tz = authStore.generalSettings?.timezone || 'UTC'

  return dayjs(date).tz(tz).format(format)
}

/**
 * Formats a datetime string or object based on the general settings in the auth store.
 * @param {string|Date|dayjs.Dayjs} date - The datetime to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
  if (!date) return ''

  const authStore = useAuthStore()
  const dateFormat = authStore.generalSettings?.date_format || 'YYYY-MM-DD'
  const timeFormat = authStore.generalSettings?.time_format || 'HH:mm'
  const tz = authStore.generalSettings?.timezone || 'UTC'

  return dayjs(date).tz(tz).format(`${dateFormat} ${timeFormat}`)
}

/**
 * Formats a number with commas and decimal places.
 * @param {number|string} num - The number to format
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '0.00'
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
