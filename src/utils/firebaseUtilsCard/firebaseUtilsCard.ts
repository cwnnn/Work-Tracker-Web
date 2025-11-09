import { collection, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'

export async function getFocusStreak(userId: string) {
  const sessionsRef = collection(db, 'users', userId, 'sessions')
  const snapshot = await getDocs(sessionsRef)

  const dateSet = new Set<string>()
  snapshot.forEach((doc) => {
    const data = doc.data()
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
    const todayStr = today.toISOString().slice(0, 10)

    const getDayStr = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null)

    const streakAtStr = getDayStr(focusStreakAt)
    const updatedAtStr = getDayStr(updatedAt)

    // Eğer focusStreakAt yoksa (ilk defa)
    if (!streakAtStr) {
      focusStreak = await getFocusStreak(userId)
      await updateDoc(statsRef, {
        focusStreak,
        focusStreakAt: new Date(),
        updatedAt: serverTimestamp(),
      })
      console.log('İlk streak başlatıldı (1)')
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
      console.log('Streak sıfırlandı (2 gün geçti, updatedAt bugün değil)')
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
      console.log('Streak artırıldı (2 gün önceydi, bugün güncellendi)')
      return focusStreak
    }

    // 3) Dünse ve updatedAt dünse -> hiçbir şey yapma
    if (diffDays === 1 && updatedAtStr === streakAtStr) {
      console.log('Dün güncellendi, bekleniyor...')
      return { streak: focusStreak, error: true }
    }

    // 4) Dünse ve updatedAt bugünse -> artır
    if (diffDays === 1 && updatedAtStr === todayStr) {
      focusStreak += 1
      await updateDoc(statsRef, {
        focusStreak,
        focusStreakAt: new Date(),
        updatedAt: serverTimestamp(),
      })
      console.log('Streak artırıldı (dün -> bugün)')
      return focusStreak
    }

    // 5) Bugünse -> hiçbir şey yapma
    if (diffDays === 0) {
      console.log('Bugün zaten güncellendi, işlem yok.')
      return focusStreak
    }
  } catch (err) {
    console.error('updateFocusStreak hata:', err)
  }
}
