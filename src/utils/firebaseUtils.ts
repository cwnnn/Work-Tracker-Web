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

// Session kaydetme
export async function saveSession(
  id: string | null,
  userId: string,
  topic: string,
  maskedDuration: string,
  seed: string,
) {
  try {
    let duration = 0
    try {
      const unmasked = unmask(maskedDuration, seed)
      duration = Number(unmasked) || 0
    } catch (err) {
      console.error('[saveSession] Süre çözümlenemedi:', err)
      await saveGlobalErrorLog(
        (err as Error).message,
        'saveSession -> unmask',
        userId,
        (err as Error).stack,
        { maskedDuration, seed },
      )
      return
    }

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
    await saveGlobalErrorLog(
      (error as Error).message,
      'saveSession',
      userId,
      (error as Error).stack,
      { id, topic, maskedDuration },
    )
  }
}

// Topic tipi
export interface UserTopic {
  id: string
  topic: string
}

// Kullanıcının topic listesini çekme
export const getUserTopics = async (userId: string): Promise<UserTopic[]> => {
  try {
    const sessionsRef = collection(db, 'users', userId, 'sessions')
    const q = query(sessionsRef, orderBy('topic', 'asc'))
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

    console.log('Benzersiz Topic Listesi (ASC):', uniqueTopics)
    return uniqueTopics
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
