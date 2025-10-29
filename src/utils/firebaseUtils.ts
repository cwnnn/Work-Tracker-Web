// src/utils/saveSession.ts
import { db } from '../firebase'
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
import { unmask } from './maskUtils'

export async function saveSession(
  id: string | null,
  userId: string,
  topic: string,
  maskedDuration: string,
  seed: string,
) {
  try {
    // Veriyi çöz
    let duration = 0
    try {
      const unmasked = unmask(maskedDuration, seed)
      duration = Number(unmasked) || 0
    } catch (err) {
      console.error('[saveSession] Süre çözümlenemedi, gönderilmiyor:', err)
      return // Hata varsa gönderme
    }

    // Firestore'a kayıt
    const generatedId = id || doc(collection(db, 'users', userId, 'sessions')).id
    const sessionsRef = collection(db, 'users', userId, 'sessions')

    await addDoc(sessionsRef, {
      id: generatedId,
      topic,
      durationValue: duration,
      date: Timestamp.fromDate(new Date()),
    })

    console.log('Session kaydedildi! Süre (ms):', duration)
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
    const q = query(sessionsRef, orderBy('topic', 'asc')) // alfabetik artan sıralama
    const snapshot = await getDocs(q)

    const allTopics = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: data.id,
        topic: data.topic,
      }
    })

    const uniqueTopics = allTopics.filter(
      (topic, index, self) => index === self.findIndex((t) => t.id === topic.id),
    )
    const sortedTopics = uniqueTopics.sort((a, b) =>
      a.topic.toLowerCase().localeCompare(b.topic.toLowerCase(), 'tr'),
    )

    console.log('Benzersiz Topic Listesi (ASC):', uniqueTopics)
    return uniqueTopics
  } catch (err) {
    console.error('Topicleri çekerken hata:', err)
    return []
  }
}

export interface Seed {
  value: string
}

export const getSeed = async (): Promise<Seed | null> => {
  try {
    // Firestore'da: seeds/{seedId}
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
    return null
  }
}
