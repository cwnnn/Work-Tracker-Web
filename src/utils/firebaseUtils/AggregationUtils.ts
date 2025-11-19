import { db } from '@/firebase'
import { doc, setDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore'
import { saveGlobalErrorLog } from '@/utils/firebaseUtils/firebaseUtils'

function localDateKey(d: Date) {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatMinutesToHourString(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}.${mins.toString().padStart(2, '0')}`
}

/* ---------------------------------------------
   DAILY
---------------------------------------------- */

export async function updateDailyStatsLite(
  userId: string,
  topicId: string,
  durationMs: number,
  endDate: Date,
) {
  try {
    const startDate = new Date(endDate.getTime() - durationMs)
    let cursor = new Date(startDate)
    let remaining = durationMs

    while (remaining > 0) {
      const nextHour = new Date(cursor)
      nextHour.setMinutes(60, 0, 0)

      const chunkMs = Math.min(remaining, nextHour.getTime() - cursor.getTime())
      const hour = cursor.getHours().toString().padStart(2, '0')
      const dayKey = localDateKey(cursor)

      const ref = doc(db, 'users', userId, 'dailyStats', `${topicId}_${dayKey}`)

      await setDoc(
        ref,
        {
          topicId,
          date: dayKey,
          data: { [hour]: increment(Math.floor(chunkMs / 60000)) },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      cursor = nextHour
      remaining -= chunkMs
    }
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      'updateDailyStatsLite failed',
      'dailyStats',
      userId,
      err instanceof Error ? err.stack : undefined,
      { userId, topicId, durationMs },
    )
  }
}

export async function getDailyStats(userId: string, topicId: string, date = new Date()) {
  try {
    const dayKey = localDateKey(date)
    const ref = doc(db, 'users', userId, 'dailyStats', `${topicId}_${dayKey}`)
    const snap = await getDoc(ref)

    const dataObj = snap.exists() ? snap.data().data || {} : {}
    const labels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
    const data = labels.map((hour) => dataObj[hour] || 0)

    return { labels, data }
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      'getDailyStats failed',
      'dailyStats',
      userId,
      err instanceof Error ? err.stack : undefined,
      { userId, topicId },
    )
    return { labels: [], data: [] }
  }
}

/* ---------------------------------------------
   WEEKLY
---------------------------------------------- */

export async function updateWeeklyStatsLite(
  userId: string,
  topicId: string,
  durationMs: number,
  endDate: Date,
) {
  try {
    const startDate = new Date(endDate.getTime() - durationMs)
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    let cursor = new Date(startDate)
    let remaining = durationMs

    while (remaining > 0) {
      const nextMidnight = new Date(cursor)
      nextMidnight.setHours(24, 0, 0, 0)

      const chunkMs = Math.min(remaining, nextMidnight.getTime() - cursor.getTime())
      const sessionDate = new Date(cursor)

      const dayOfWeek = sessionDate.getDay() === 0 ? 7 : sessionDate.getDay()
      const dayLabel = dayLabels[dayOfWeek - 1]

      const monday = new Date(sessionDate)
      monday.setDate(sessionDate.getDate() - (dayOfWeek - 1))
      monday.setHours(0, 0, 0, 0)

      const weekKey = monday.toISOString().slice(0, 10)
      const ref = doc(db, 'users', userId, 'weeklyStats', `${topicId}_${weekKey}`)

      await setDoc(
        ref,
        {
          topicId,
          weekStart: weekKey,
          data: { [dayLabel!]: increment(Math.floor(chunkMs / 60000)) },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      cursor = nextMidnight
      remaining -= chunkMs
    }
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      'updateWeeklyStatsLite failed',
      'weeklyStats',
      userId,
      err instanceof Error ? err.stack : undefined,
      { userId, topicId, durationMs },
    )
  }
}

export async function getWeeklyStats(userId: string, topicId: string, date = new Date()) {
  try {
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()
    const monday = new Date(date)
    monday.setDate(date.getDate() - (dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)

    const weekKey = monday.toISOString().slice(0, 10)
    const ref = doc(db, 'users', userId, 'weeklyStats', `${topicId}_${weekKey}`)
    const snap = await getDoc(ref)

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const dataObj = snap.exists() ? snap.data().data || {} : {}

    const data = dayLabels.map((day) => formatMinutesToHourString(dataObj[day] || 0))

    return { labels: dayLabels, data }
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      'getWeeklyStats failed',
      'weeklyStats',
      userId,
      err instanceof Error ? err.stack : undefined,
      { userId, topicId },
    )
    return { labels: [], data: [] }
  }
}

/* ---------------------------------------------
   MONTHLY
---------------------------------------------- */

export async function updateMonthlyStatsLite(
  userId: string,
  topicId: string,
  durationMs: number,
  endDate: Date,
) {
  try {
    const startDate = new Date(endDate.getTime() - durationMs)
    let cursor = new Date(startDate)
    let remaining = durationMs

    while (remaining > 0) {
      const nextMidnight = new Date(cursor)
      nextMidnight.setHours(24, 0, 0, 0)

      const chunkMs = Math.min(remaining, nextMidnight.getTime() - cursor.getTime())

      const year = cursor.getFullYear()
      const month = (cursor.getMonth() + 1).toString().padStart(2, '0')
      const day = cursor.getDate().toString().padStart(2, '0')

      const monthKey = `${year}-${month}`
      const ref = doc(db, 'users', userId, 'monthlyStats', `${topicId}_${monthKey}`)

      await setDoc(
        ref,
        {
          topicId,
          month: monthKey,
          data: { [day]: increment(Math.floor(chunkMs / 60000)) },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      cursor = nextMidnight
      remaining -= chunkMs
    }
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      'updateMonthlyStatsLite failed',
      'monthlyStats',
      userId,
      err instanceof Error ? err.stack : undefined,
      { userId, topicId, durationMs },
    )
  }
}

export async function getMonthlyStats(userId: string, topicId: string, date = new Date()) {
  try {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')

    const monthKey = `${year}-${month}`
    const ref = doc(db, 'users', userId, 'monthlyStats', `${topicId}_${monthKey}`)
    const snap = await getDoc(ref)

    const dataObj = snap.exists() ? snap.data().data || {} : {}
    const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate()

    const labels = Array.from({ length: daysInMonth }, (_, i) =>
      (i + 1).toString().padStart(2, '0'),
    )

    const data = labels.map((day) => formatMinutesToHourString(dataObj[day] || 0))

    return { labels, data }
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      'getMonthlyStats failed',
      'monthlyStats',
      userId,
      err instanceof Error ? err.stack : undefined,
      { userId, topicId },
    )
    return { labels: [], data: [] }
  }
}

/* ---------------------------------------------
   YEARLY
---------------------------------------------- */

export async function updateYearlyStatsLite(
  userId: string,
  topicId: string,
  durationMs: number,
  endDate: Date,
) {
  try {
    const startDate = new Date(endDate.getTime() - durationMs)
    let cursor = new Date(startDate)
    let remaining = durationMs

    while (remaining > 0) {
      const nextMidnight = new Date(cursor)
      nextMidnight.setHours(24, 0, 0, 0)

      const chunkMs = Math.min(remaining, nextMidnight.getTime() - cursor.getTime())

      const year = cursor.getFullYear()
      const month = (cursor.getMonth() + 1).toString().padStart(2, '0')

      const yearKey = `${year}`
      const ref = doc(db, 'users', userId, 'yearlyStats', `${topicId}_${yearKey}`)

      await setDoc(
        ref,
        {
          topicId,
          year: yearKey,
          data: { [month]: increment(Math.floor(chunkMs / 60000)) },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      cursor = nextMidnight
      remaining -= chunkMs
    }
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      'updateYearlyStatsLite failed',
      'yearlyStats',
      userId,
      err instanceof Error ? err.stack : undefined,
      { userId, topicId, durationMs },
    )
  }
}

export async function getYearlyStats(userId: string, topicId: string, date = new Date()) {
  try {
    const yearKey = date.getFullYear().toString()
    const ref = doc(db, 'users', userId, 'yearlyStats', `${topicId}_${yearKey}`)
    const snap = await getDoc(ref)

    const dataObj = snap.exists() ? snap.data().data || {} : {}

    const labels = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
    const data = labels.map((m) => formatMinutesToHourString(dataObj[m] || 0))

    return { labels, data }
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      'getYearlyStats failed',
      'yearlyStats',
      userId,
      err instanceof Error ? err.stack : undefined,
      { userId, topicId },
    )
    return { labels: [], data: [] }
  }
}

/* ---------------------------------------------
   TODAY FROM MONTHLY
---------------------------------------------- */

export async function getTodayFromMonthlyLite(userId: string, topicId: string, date = new Date()) {
  try {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    const monthKey = `${year}-${month}`
    const docId = `${topicId}_${monthKey}`

    const ref = doc(db, 'users', userId, 'monthlyStats', docId)
    const snap = await getDoc(ref)

    if (!snap.exists()) return 0

    const data = snap.data().data || {}
    const minutes = data[day] || 0

    return minutes * 60 * 1000
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      'getTodayFromMonthlyLite failed',
      'monthlyStats',
      userId,
      err instanceof Error ? err.stack : undefined,
      { userId, topicId },
    )
    return 0
  }
}
