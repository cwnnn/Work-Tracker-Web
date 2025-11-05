import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

export async function getTotalHoursByTopic(userId: string, topicId: string) {
  try {
    const sessionsRef = collection(db, 'users', userId, 'sessions')
    const q = query(sessionsRef, where('id', '==', topicId))
    const snapshot = await getDocs(q)

    let totalMs = 0
    snapshot.forEach((doc) => {
      const data = doc.data()
      if (typeof data.durationValue === 'number') {
        totalMs += data.durationValue
      }
    })

    const totalMinutes = Math.floor(totalMs / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return `${hours}:${minutes.toString().padStart(2, '0')}`
  } catch (error) {
    console.error('[getTotalHoursByTopic] Hata:', error)
    return '0:00'
  }
}
