import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { useTopicStatsStore } from '@/stores/topicStatsStore'
import { saveGlobalErrorLog } from '@/utils/firebaseUtils/firebaseUtils'

export async function getAllTopicsWithTotalHours(userId: string) {
  const topicStatsStore = useTopicStatsStore()

  try {
    const topicsRef = collection(db, 'users', userId, 'topics')
    const snapshot = await getDocs(topicsRef)

    const topicMap: Record<string, number> = {}

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const topicId = doc.id
      const topicName = data.topic || 'Unknown'
      const totalMs = data.totalMs || 0
      const sessionCount = data.sessionCount || 0
      const levelName = data.level || 'Beginner'
      const levelIndex = data.levelIndex || 0
      const lastSessionAt = data.lastSessionAt
        ? (data.lastSessionAt.toDate?.() ?? data.lastSessionAt)
        : null

      topicMap[topicName] = (topicMap[topicName] || 0) + totalMs

      topicStatsStore.setStats(
        topicId,
        topicName,
        totalMs,
        sessionCount,
        levelName,
        levelIndex,
        lastSessionAt,
      )
    })

    const labels = Object.keys(topicMap)
    const data = labels.map((label) =>
      Number(((topicMap[label] ?? 0) / (1000 * 60 * 60)).toFixed(2)),
    )

    return { labels, data }
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      err instanceof Error ? err.message : String(err),
      'getAllTopicsWithTotalHours',
      userId,
      err instanceof Error ? err.stack : undefined,
    )

    throw err
  }
}
