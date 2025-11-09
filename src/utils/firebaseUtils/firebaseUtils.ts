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

// Hata kayıt fonksiyonu
export async function saveGlobalErrorLog(
  message: string,
  context: string,
  userId?: string,
  stack?: string,
  additionalData?: Record<string, unknown>,
) {
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

    console.log('[saveGlobalErrorLog] Hata kaydedildi:', message)
  } catch (err) {
    console.error('[saveGlobalErrorLog] Hata kaydedilemedi:', err)
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

    console.log('Kullanıcının topic listesi (ASC):', topics)
    return topics
  } catch (err) {
    console.error('Topicleri çekerken hata:', err)
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
      console.log('Seed bulunamadı')
      return null
    }
  } catch (err) {
    console.error('Seed’i çekerken hata:', err)
    await saveGlobalErrorLog((err as Error).message, 'getSeed', undefined, (err as Error).stack)
    return null
  }
}
//stats>allTopics verilerini store a kayıt eder
export async function getStatsAllTopics(userId: string) {
  const AllTopicStatsStore = useAllTopicStatsStore()

  try {
    if (!userId) {
      console.error('[getStatsAllTopics] userId eksik.')
      return null
    }

    const statsRef = doc(db, 'users', userId, 'stats', 'allTopics')
    const statsSnap = await getDoc(statsRef)

    if (!statsSnap.exists()) {
      console.warn('[getStatsAllTopics] allTopics belgesi bulunamadı.')
      return null
    }

    const data = statsSnap.data()
    AllTopicStatsStore.setStats(data)

    return console.log('alltopicsstate:', data)
  } catch (err) {
    console.error('[getStatsAllTopics] Hata:', err)
    await saveGlobalErrorLog(
      (err as Error).message,
      'getStatsAllTopics',
      userId,
      (err as Error).stack,
    )
    return null
  }
}
