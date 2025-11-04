import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

export async function getAllTopicsWithTotalHours(userId: string) {
  try {
    //tüm kullanıcı sessionlarını tek seferde çekiyoruz (performans önemli)
    const sessionsRef = collection(db, 'users', userId, 'sessions')
    const sessionSnapshot = await getDocs(sessionsRef)

    //Kullanılan tüm topic isimlerini alıyoruz
    const topicMap: Record<string, number> = {}

    sessionSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      const topicName = data.topic || 'Unknown'
      const duration = data.durationValue || 0

      if (!topicMap[topicName]) topicMap[topicName] = 0
      topicMap[topicName] += duration
    })

    const labels = Object.keys(topicMap)
    const data = labels.map(
      (label) => Number(((topicMap[label] ?? 0) / (1000 * 60 * 60)).toFixed(2)), // ms → saat
    )

    console.log('labels:', labels, 'data:', data)
    return { labels, data }
  } catch (err) {
    console.error('[getAllTopicsWithTotalHours] Hata:', err)
    throw err
  }
}
