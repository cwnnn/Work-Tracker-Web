import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  query,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { saveGlobalErrorLog } from '@/utils/firebaseUtils/firebaseUtils'

async function getFocusStreak(userId: string) {
  try {
    const sessionsRef = collection(db, 'users', userId, 'sessions')
    const snapshot = await getDocs(sessionsRef)

    const dateSet = new Set<string>()
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      if (data.date?.toDate) {
        const d = data.date.toDate()
        const dateStr = d.toISOString().split('T')[0]
        dateSet.add(dateStr)
      }
    })

    const dates = Array.from(dateSet).sort((a, b) => (a > b ? -1 : 1))

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    if (!dateSet.has(todayStr!)) return 0

    let streak = 1
    let previous = new Date(todayStr!)

    for (let i = 1; i < dates.length; i++) {
      const current = new Date(dates[i]!)
      const diffDays = Math.floor((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        streak++
        previous = current
      } else {
        break
      }
    }

    return streak
  } catch (error: unknown) {
    await saveGlobalErrorLog(
      error instanceof Error ? error.message : 'Unknown error',
      'getFocusStreak',
      userId,
      error instanceof Error ? error.stack : undefined,
    )
    throw error
  }
}

export async function updateFocusStreak(userId: string) {
  try {
    const statsRef = doc(db, 'users', userId, 'stats', 'allTopics')
    const snap = await getDoc(statsRef)
    if (!snap.exists()) return

    const data = snap.data()
    const focusStreakAt = data.focusStreakAt?.toDate?.() || null
    const updatedAt = data.updatedAt?.toDate?.() || null
    let focusStreak = data.focusStreak || 0

    const today = new Date()

    // Yardımcı: Date -> YYYY-MM-DD string (timezone offset düzeltilmiş)
    const toLocalDateStr = (d: Date | null) =>
      d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : null

    const streakAtStr = toLocalDateStr(focusStreakAt)
    const updatedAtStr = toLocalDateStr(updatedAt)
    const todayStr = toLocalDateStr(new Date())

    // Eğer focusStreakAt yoksa (ilk defa)
    if (!streakAtStr) {
      focusStreak = await getFocusStreak(userId)
      await updateDoc(statsRef, {
        focusStreak,
        focusStreakAt: new Date(),
        updatedAt: serverTimestamp(),
      })
      return focusStreak
    }

    // Tarih farkını hesapla (sadece gün bazında)
    const diffDays = Math.floor(
      (today.setHours(0, 0, 0, 0) - new Date(focusStreakAt).setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24),
    )

    // ---- Kurallar ----
    // 1) 2 gün geçtiyse ve updatedAt bugün değilse -> sıfırla
    if (diffDays >= 2 && updatedAtStr !== todayStr) {
      focusStreak = 0
      await updateDoc(statsRef, {
        focusStreak,
      })
      return focusStreak
    }

    // 2) 2 gün geçtiyse ve updatedAt bugünse -> bir yap
    if (diffDays >= 2 && updatedAtStr === todayStr) {
      focusStreak = 1
      await updateDoc(statsRef, {
        focusStreak,
        focusStreakAt: new Date(),
        updatedAt: serverTimestamp(),
      })
      return focusStreak
    }

    // 3) Dünse ve updatedAt dünse -> alarm ver (karta alarm göstermek için)
    if (diffDays === 1 && updatedAtStr === streakAtStr) {
      return { streak: focusStreak, alarm: true }
    }

    // 4) Dünse ve updatedAt bugünse -> artır
    if (diffDays === 1 && updatedAtStr === todayStr) {
      focusStreak += 1
      await updateDoc(statsRef, {
        focusStreak,
        focusStreakAt: new Date(),
        updatedAt: serverTimestamp(),
      })
      return focusStreak
    }

    // 5) Bugünse -> hiçbir şey yapma
    if (diffDays === 0) {
      return focusStreak
    }

    // Diğer durumlarda sessizce çık
    return focusStreak
  } catch (error: unknown) {
    await saveGlobalErrorLog(
      error instanceof Error ? error.message : 'Unknown error',
      'updateFocusStreak',
      userId,
      error instanceof Error ? error.stack : undefined,
    )
  }
}

async function getPeakFocusSession(userId: string) {
  try {
    const sessionsRef = collection(db, 'users', userId, 'sessions')
    const snapshot = await getDocs(sessionsRef)

    let maxDuration = 0

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      const duration = data.durationValue || 0
      if (duration > maxDuration) {
        maxDuration = duration
      }
    })

    return maxDuration
  } catch (error: unknown) {
    await saveGlobalErrorLog(
      error instanceof Error ? error.message : 'Unknown error',
      'getPeakFocusSession',
      userId,
      error instanceof Error ? error.stack : undefined,
    )
    throw error
  }
}

export async function updatePeakFocusSession(userId: string, newDuration: number) {
  try {
    const statsRef = doc(db, 'users', userId, 'stats', 'allTopics')
    const statsSnap = await getDoc(statsRef)
    if (!statsSnap.exists()) {
      return null
    }

    const data = statsSnap.data()
    let currentPeak

    if (!data.peakFocusSession) {
      // peakFocusSession değeri yoksa önce mevcut maksimumu hesapla
      currentPeak = await getPeakFocusSession(userId)
      if (newDuration > currentPeak) {
        await updateDoc(statsRef, { peakFocusSession: newDuration })
      } else {
        await setDoc(statsRef, { peakFocusSession: currentPeak }, { merge: true })
      }
      return
    }

    currentPeak = data?.peakFocusSession || 0

    // Gelen değer daha büyükse güncelle
    if (newDuration > currentPeak) {
      await updateDoc(statsRef, { peakFocusSession: newDuration })
    }
  } catch (error: unknown) {
    await saveGlobalErrorLog(
      error instanceof Error ? error.message : 'Unknown error',
      'updatePeakFocusSession',
      userId,
      error instanceof Error ? error.stack : undefined,
    )
  }
}

async function getSessionsStatsByDateRange(userId: string, days: number) {
  try {
    const sessionsRef = collection(db, 'users', userId, 'sessions')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)
    start.setDate(today.getDate() - (days - 1))

    const q = query(sessionsRef, where('date', '>=', Timestamp.fromDate(start)))
    const snap = await getDocs(q)

    let totalMs = 0
    const dayKeys = new Set<string>()

    snap.forEach((docSnap) => {
      const data = docSnap.data() as { durationValue?: number; date?: Timestamp }
      const dur = data.durationValue ?? 0
      totalMs += dur

      const dt = data.date?.toDate?.()
      if (dt) {
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
          dt.getDate(),
        ).padStart(2, '0')}`
        dayKeys.add(key)
      }
    })

    return { totalMs, daysWithData: dayKeys.size }
  } catch (error: unknown) {
    await saveGlobalErrorLog(
      error instanceof Error ? error.message : 'Unknown error',
      'getSessionsStatsByDateRange',
      userId,
      error instanceof Error ? error.stack : undefined,
    )
    throw error
  }
}

export async function updateAvgDailyFocus(userId: string) {
  try {
    const statsRef = doc(db, 'users', userId, 'stats', 'allTopics')
    const statsSnap = await getDoc(statsRef)
    if (!statsSnap.exists()) return

    const data = statsSnap.data()
    const lastUpdated = data.avgDailyFocusLastUpdated?.toDate?.() ?? null

    // Bugün içinde zaten güncellendiyse çık
    const now = new Date()
    const isSameDay =
      lastUpdated &&
      lastUpdated.getFullYear() === now.getFullYear() &&
      lastUpdated.getMonth() === now.getMonth() &&
      lastUpdated.getDate() === now.getDate()

    if (isSameDay) {
      return
    }

    const { totalMs, daysWithData } = await getSessionsStatsByDateRange(userId, 7)

    if (daysWithData === 0) {
      await updateDoc(statsRef, {
        avgDailyFocusMs: 0,
        avgDailyFocusLastUpdated: serverTimestamp(),
      })
      return 0
    }

    const avgDailyFocusMs = totalMs / daysWithData

    await updateDoc(statsRef, {
      avgDailyFocusMs,
      avgDailyFocusLastUpdated: serverTimestamp(),
    })

    return avgDailyFocusMs
  } catch (error: unknown) {
    await saveGlobalErrorLog(
      error instanceof Error ? error.message : 'Unknown error',
      'updateAvgDailyFocus',
      userId,
      error instanceof Error ? error.stack : undefined,
    )
  }
}
