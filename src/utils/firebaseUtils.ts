// src/utils/saveSession.ts
import { db } from '../firebase'
import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore'

export async function saveSession(userId: string, topic: string, duration: number) {
  try {
    const sessionsRef = collection(db, 'users', userId, 'sessions')
    await addDoc(sessionsRef, {
      topic,
      duration,
      date: Timestamp.fromDate(new Date()),
    })
    console.log('Session kaydedildi!')
  } catch (error) {
    console.error('Session kaydedilemedi:', error)
  }
}

export interface UserTopic {
  id: string
  topic: string
}

export const getUserTopics = async (userId: string): Promise<UserTopic[]> => {
  try {
    const sessionsRef = collection(db, 'users', userId, 'sessions')
    const snapshot = await getDocs(sessionsRef)

    // Her belge için id ve topic alanlarını topla
    const topics: UserTopic[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      topic: doc.data().topic,
    }))

    console.log('Kullanıcı Topic Listesi:', topics)
    return topics
  } catch (err) {
    console.error('Topicleri çekerken hata:', err)
    return []
  }
}
