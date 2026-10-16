export const todayIso = (now: Date = new Date()): string => {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const isoWeekKey = (now: Date = new Date()): string => {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayNumber = (date.getDay() + 6) % 7

  date.setDate(date.getDate() - dayNumber + 3)

  const firstThursday = new Date(date.getFullYear(), 0, 4)
  const firstDayNumber = (firstThursday.getDay() + 6) % 7

  firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3)

  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000))

  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`
}

const toUtc = (isoDay: string): number => {
  const [year, month, day] = isoDay.split('-').map(Number)

  return Date.UTC(year, month - 1, day)
}

export const daysBetween = (fromIsoDay: string, toIsoDay: string): number =>
  Math.round((toUtc(toIsoDay) - toUtc(fromIsoDay)) / 86400000)
