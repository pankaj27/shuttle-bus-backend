import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'
/**
 * Converts a time string or dayjs object to total minutes since the beginning of the day.
 * @param {string|dayjs.Dayjs} time - The time to convert
 * @returns {number|null} Total minutes since midnight or null if invalid
 */
export const timeToMinutes = (time) => {
  if (!time) return null
  const d = dayjs(time)
  if (!d.isValid()) return null
  return d.hour() * 60 + d.minute()
}

/**
 * Converts a number of minutes to a dayjs object for today.
 * @param {number} minutes - Total minutes since midnight
 * @returns {dayjs.Dayjs}
 */
export const minutesToDayjs = (minutes) => {
  if (minutes === null || minutes === undefined) return null
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return dayjs().hour(hours).minute(mins).second(0).millisecond(0)
}

/**
 * Converts a number of minutes to a human readable time string.
 * @param {number} minutes - Total minutes since midnight
 * @param {string} [format='HH:mm'] - Format string
 * @returns {string} Formatted time string
 */
export const minutesToTime = (minutes) => {
  const authStore = useAuthStore()
  const fallbackFormat = authStore.generalSettings?.time_format || 'HH:mm'

  if (minutes === null || minutes === undefined) return 'N/A'
  const d = minutesToDayjs(minutes)
  return d ? d.format(fallbackFormat) : 'N/A'
}
