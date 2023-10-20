import GLib from 'gi://GLib'

const ByteArray = imports.byteArray;

let CACHE = {}
const CACHE_TIME = 10 * 1000

const _MS_PER_SECONDS = 1000
const _MS_PER_MINUTE = 1000 * 60
const _MS_PER_HOUR = 1000 * 60 * 60
const _MS_PER_DAY = 1000 * 60 * 60 * 24

export const isNullOrUndefined = value => typeof value === 'undefined' || value === null
export const isNullOrEmpty = value => isNullOrUndefined(value) || value.length === 0
export const fallbackIfNaN = value => typeof value === 'undefined' || value === null || isNaN(value) ? '--' : value

export const decodeBase64JsonOrDefault = (encodedJson, defaultValue) => {
  try {
    const value = JSON.parse(ByteArray.toString(GLib.base64_decode(encodedJson)))

    if (!value) {
      return defaultValue
    }

    return value
  } catch (e) {
    log(`failed to decode base64 json ${e}`)
    return defaultValue
  }
}

export const clearCache = () => {
  CACHE = {}
}

export const cacheOrDefault = async (cacheKey, evaluator, cacheDuration = CACHE_TIME) => {
  const [timestamp, data] = CACHE[cacheKey] || []

  if (timestamp && data && timestamp + cacheDuration >= Date.now()) {
    return data
  }

  const freshData = await evaluator()

  CACHE[cacheKey] = [Date.now(), freshData]

  return freshData
}

export const getPipelineStatusIconName = status => {
  switch (status) {
    case 'created':
      return 'creating-symbolic'

    case 'pending':
    case 'waiting_for_resource':
      return 'waiting_pending'

    case 'preparing':
      return 'preparing-symbolic'

    case 'running':
      return 'running'

    case 'success':
      return 'success'

    case 'failed':
      return 'failed'

    case 'canceled':
      return 'canceled-symbolic'

    case 'skipped':
      return 'skipped-symbolic'

    case 'manual':
      return 'manual-symbolic'

    case 'scheduled':
      return 'scheduled-symbolic'
  }
}

export const getHumanReadableData = (relevantDate, compareToDate) => {
  if (!compareToDate) {
    compareToDate = new Date()
  }

  relevantDate = new Date(relevantDate)

  if (!compareToDate || !relevantDate) {
    return
  }

  const diffTime = compareToDate - relevantDate
  let result = ''

  const seconds = Math.floor(diffTime / _MS_PER_SECONDS)
  const minutes = Math.floor(diffTime / _MS_PER_MINUTE)
  const hours = Math.floor(diffTime / _MS_PER_HOUR)

  if (!hours && !minutes) {
    result = seconds + 's'
  } else if (!hours) {
    result = minutes + 'm'
  } else if (hours <= 24) {
    result = hours + 'h'
  } else {
    const compareDateUtc = Date.UTC(compareToDate.getFullYear(), compareToDate.getMonth(), compareToDate.getDate())
    const relevantDateUtc = Date.UTC(relevantDate.getFullYear(), relevantDate.getMonth(), relevantDate.getDate())
    result = Math.floor((compareDateUtc - relevantDateUtc) / _MS_PER_DAY) + 'd'
  }

  return result
}

