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
