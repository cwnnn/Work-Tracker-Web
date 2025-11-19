import { db } from '../../firebase'
import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { useAllTopicStatsStore } from '../../stores/AllTopicStatsStore'

let errorLogFailCount = 0
const ERROR_LOG_FAIL_LIMIT = 3
let errorLoggingDisabled = false

export async function saveGlobalErrorLog(
  message: string,
  context: string,
  userId?: string,
  stack?: string,
  additionalData?: Record<string, unknown>,
) {
  if (errorLoggingDisabled) return

  try {
    const errorsRef = collection(db, 'errors')
    await addDoc(errorsRef, {
      message,
      context,
      userId: userId || 'anonymous',
      stack: stack || null,
      additionalData: additionalData || null,
      userAgent: navigator.userAgent,
      time: Timestamp.fromDate(new Date()),
    })

    // Başarılı olursa fail counter sıfırlanır
    errorLogFailCount = 0
  } catch (err) {
    errorLogFailCount++

    // Kırılma eşiğine ulaşıldıysa logging sistemini durdur
    if (errorLogFailCount >= ERROR_LOG_FAIL_LIMIT) {
      errorLoggingDisabled = true

      console.error(
        `[GLOBAL LOGGING DISABLED] Failed ${errorLogFailCount} times.`,
        'Original error:',
        message,
        'Logging error:',
        err,
      )
    }
  }
}

// Topic tipi
export interface UserTopic {
  id: string
  topic: string
}

export const getUserTopics = async (userId: string): Promise<UserTopic[]> => {
  try {
    const topicsRef = collection(db, 'users', userId, 'topics')
    const q = query(topicsRef, orderBy('topic', 'asc'))
    const snapshot = await getDocs(q)

    const topics: UserTopic[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      topic: doc.data().topic || 'Unknown',
    }))
    return topics
  } catch (err) {
    await saveGlobalErrorLog((err as Error).message, 'getUserTopics', userId, (err as Error).stack)
    return []
  }
}

// Seed tipi
export interface Seed {
  value: string
}

// Seed çekme
export const getSeed = async (): Promise<Seed | null> => {
  try {
    const seedRef = doc(db, 'seeds', '1')
    const seedSnap = await getDoc(seedRef)

    if (seedSnap.exists()) {
      const data = seedSnap.data()
      return { value: data.value } as Seed
    } else {
      return null
    }
  } catch (err) {
    await saveGlobalErrorLog((err as Error).message, 'getSeed', undefined, (err as Error).stack)
    return null
  }
}
//stats>allTopics verilerini store a kayıt eder
export async function getStatsAllTopics(userId: string) {
  const AllTopicStatsStore = useAllTopicStatsStore()

  try {
    if (!userId) {
      return null
    }

    const statsRef = doc(db, 'users', userId, 'stats', 'allTopics')
    const statsSnap = await getDoc(statsRef)

    if (!statsSnap.exists()) {
      return null
    }

    const data = statsSnap.data()
    AllTopicStatsStore.setStats(data)
  } catch (err) {
    await saveGlobalErrorLog(
      (err as Error).message,
      'getStatsAllTopics',
      userId,
      (err as Error).stack,
    )
    return null
  }
}
