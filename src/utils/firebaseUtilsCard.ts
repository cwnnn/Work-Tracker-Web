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

    //milisaniyeyi saate çevir (örneğin 2.5 => 2 saat 30 dakika)
    const totalHours = totalMs / (1000 * 60 * 60)

    return totalHours
  } catch (error) {
    console.error('[getTotalHoursByTopic] Hata:', error)
    return 0
  }
}
