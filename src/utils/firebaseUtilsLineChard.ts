import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'

export async function getTodaySessionsByTopic(userId: string, topicId: string) {
  try {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      value: 0,
    }))

    const start = new Date()
    start.setHours(0, 0, 0, 0)

    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const sessionsRef = collection(db, 'users', userId, 'sessions')
    const q = query(
      sessionsRef,
      where('id', '==', topicId),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
    )

    const snapshot = await getDocs(q)

    const sessions = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        date: data.date.toDate(),
        duration: data.durationValue,
      }
    })

    for (const session of sessions) {
      const endTime = session.date
      const endMinutes = endTime.getHours() * 60 + endTime.getMinutes()
      let remainingMinutes = Math.floor(session.duration / 60000)
      let currentMinute = endMinutes - remainingMinutes

      while (remainingMinutes > 0) {
        const currentHour = Math.floor(currentMinute / 60)
        if (currentHour < 0 || currentHour > 23) break

        const usedMinutes = Math.min(60 - (currentMinute % 60), remainingMinutes)

        hours[currentHour]!.value += usedMinutes
        remainingMinutes -= usedMinutes
        currentMinute += usedMinutes
      }
    }

    return hours
  } catch (err) {
    console.error('[getTodaySessionsByTopic] Hata:', err)
    return []
  }
}

export async function getWeeklySessionsByTopic(userId: string, topicId: string) {
  try {
    //Şu anki tarih
    const now = new Date()

    //Haftanın günü (Pazartesi = 1, Pazar = 0)
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()

    //Pazartesi 00:00
    const start = new Date(now)
    start.setDate(now.getDate() - (dayOfWeek - 1))
    start.setHours(0, 0, 0, 0)

    //Pazar 23:59:59
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    const sessionsRef = collection(db, 'users', userId, 'sessions')
    const q = query(
      sessionsRef,
      where('id', '==', topicId),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
    )

    const snapshot = await getDocs(q)

    //Pazartesi → Pazar arası 7 günlük boş array
    const days = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(start.getTime() + i * 24 * 60 * 60 * 1000),
      totalMinutes: 0,
    }))

    //Günlere göre süreleri topla
    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const sessionDate = data.date.toDate()
      const durationMinutes = Math.floor(data.durationValue / 60000)
      const diffDays = Math.floor(
        (sessionDate.setHours(0, 0, 0, 0) - start.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (diffDays >= 0 && diffDays < 7) {
        days[diffDays]!.totalMinutes += durationMinutes
      }
    })

    //Gün etiketleri
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    return {
      labels: dayLabels,
      data: days.map((d) => {
        const hours = Math.floor(d.totalMinutes / 60)
        const minutes = Math.floor(d.totalMinutes % 60)
        return Number(`${hours}.${minutes.toString().padStart(2, '0')}`)
      }),
    }
  } catch (err) {
    console.error('[getWeeklySessionsByTopic] Hata:', err)
    return { labels: [], data: [] }
  }
}

export async function getMonthlySessionsByTopic(userId: string, topicId: string) {
  try {
    //Şu anki tarih
    const now = new Date()

    //Ayın ilk günü 00:00
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)

    //Ayın son günü 23:59:59
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    //Bu ay kaç gün çekiyor
    const daysInMonth = end.getDate()

    const sessionsRef = collection(db, 'users', userId, 'sessions')
    const q = query(
      sessionsRef,
      where('id', '==', topicId),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
    )

    const snapshot = await getDocs(q)

    //Gün bazlı boş array
    const days = Array.from({ length: daysInMonth }, (_, i) => ({
      date: new Date(now.getFullYear(), now.getMonth(), i + 1),
      totalMinutes: 0,
    }))

    //Oturumları günlere göre dağıt
    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const sessionDate = data.date.toDate()
      const durationMinutes = Math.floor(data.durationValue / 60000)
      const dayIndex = sessionDate.getDate() - 1

      if (dayIndex >= 0 && dayIndex < daysInMonth) {
        days[dayIndex]!.totalMinutes += durationMinutes
      }
    })

    //günler için label
    const monthName = now.toLocaleString('en', { month: 'short' }) // örn: "Nov"
    const dayLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1} ${monthName}`)

    //Saat.dakika biçimine çevir
    const data = days.map((d) => {
      const hours = Math.floor(d.totalMinutes / 60)
      const minutes = Math.floor(d.totalMinutes % 60)
      return Number(`${hours}.${minutes.toString().padStart(2, '0')}`)
    })

    return { labels: dayLabels, data }
  } catch (err) {
    console.error('[getMonthlySessionsByTopic] Hata:', err)
    return { labels: [], data: [] }
  }
}

export async function getYearlySessionsByTopic(userId: string, topicId: string) {
  try {
    const now = new Date()

    //Yılın başı 1 Ocak 00:00
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)

    //Yılın sonu 31 Aralık 23:59:59
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)

    const sessionsRef = collection(db, 'users', userId, 'sessions')
    const q = query(
      sessionsRef,
      where('id', '==', topicId),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
    )

    const snapshot = await getDocs(q)

    //12 ay için boş array
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i, // 0-11
      totalMinutes: 0,
    }))

    //Verileri aylara göre topla
    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const sessionDate = data.date.toDate()
      const durationMinutes = Math.floor(data.durationValue / 60000)
      const monthIndex = sessionDate.getMonth()

      if (monthIndex >= 0 && monthIndex < 12) {
        months[monthIndex]!.totalMinutes += durationMinutes
      }
    })

    //Ay etiketleri
    const monthLabels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    //Saat.dakika biçimine çevir
    const data = months.map((m) => {
      const hours = Math.floor(m.totalMinutes / 60)
      const minutes = Math.floor(m.totalMinutes % 60)
      return Number(`${hours}.${minutes.toString().padStart(2, '0')}`)
    })

    return { labels: monthLabels, data }
  } catch (err) {
    console.error('[getYearlySessionsByTopic] Hata:', err)
    return { labels: [], data: [] }
  }
}
