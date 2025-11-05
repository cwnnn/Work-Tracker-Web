import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { useTopicStatsStore } from '@/stores/topicStatsStore'

export async function getAllTopicsWithTotalHours(userId: string) {
  const topicStatsStore = useTopicStatsStore()

  try {
    // Firestore'dan topics koleksiyonunu çek
    const topicsRef = collection(db, 'users', userId, 'topics')
    const snapshot = await getDocs(topicsRef)

    // Verileri toplamak için map
    const topicMap: Record<string, number> = {}

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const topicId = doc.id
      const topicName = data.topic || 'Unknown'
      const totalMs = data.totalMs || 0
      const sessionCount = data.sessionCount || 0
      const levelName = data.level || 'Beginner'
      const levelIndex = data.levelIndex || 0

      // Toplam süreleri hesapla
      topicMap[topicName] = (topicMap[topicName] || 0) + totalMs

      // Her topic'i store'a kaydet
      topicStatsStore.setStats(topicId, topicName, totalMs, sessionCount, levelName, levelIndex)
    })

    // Chart.js formatında veri hazırla
    const labels = Object.keys(topicMap)
    const data = labels.map((label) =>
      Number(((topicMap[label] ?? 0) / (1000 * 60 * 60)).toFixed(2)),
    ) // ms → saat

    console.log('Topic stats updated:', topicStatsStore.stats)
    return { labels, data }
  } catch (err) {
    console.error('[getAllTopicsWithTotalHours] Hata:', err)
    throw err
  }
}
