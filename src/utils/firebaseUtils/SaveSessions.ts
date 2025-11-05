import { db } from '@/firebase'
import {
  addDoc,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { saveGlobalErrorLog } from '../firebaseUtils'
import { unmask } from '../maskUtils'

const HOUR = 60 * 60 * 1000

export const LEVELS = [
  { name: 'Beginner', threshold: 0 * HOUR },
  { name: 'Novice', threshold: 10 * HOUR },
  { name: 'Learner', threshold: 30 * HOUR },
  { name: 'Intermediate', threshold: 70 * HOUR },
  { name: 'Skilled', threshold: 120 * HOUR },
  { name: 'Advanced', threshold: 200 * HOUR },
  { name: 'Proficient', threshold: 350 * HOUR },
  { name: 'Expert', threshold: 500 * HOUR },
  { name: 'Master', threshold: 700 * HOUR },
  { name: 'Grandmaster', threshold: 900 * HOUR },
  { name: 'Mythic', threshold: 1200 * HOUR },
  { name: 'Transcendent', threshold: 2000 * HOUR },
  { name: 'Celestial', threshold: 5000 * HOUR },
  { name: 'Omniscient', threshold: 10000 * HOUR },
]

export async function createTopic(userId: string, topicName: string) {
  try {
    const topicsRef = collection(db, 'users', userId, 'topics')

    //Firestore'dan otomatik ID üretelim
    const newDocRef = doc(topicsRef)
    const topicId = newDocRef.id

    //Başlangıç verisi
    const payload = {
      topic: topicName,
      totalMs: 0,
      sessionCount: 0,
      lastSessionAt: null,
      level: 'Beginner',
      levelIndex: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    //Firestore’a kaydet
    await setDoc(newDocRef, payload)

    console.log(`Yeni topic oluşturuldu: ${topicName} (${topicId})`)
    return { topicId, ...payload }
  } catch (error) {
    console.error('Topic oluşturulamadı:', error)
    await saveGlobalErrorLog(
      (error as Error).message,
      'createTopic',
      userId,
      (error as Error).stack,
      { topicName },
    )
    throw error
  }
}

// --- utils/firebaseSessionUtils.ts ---

//Süre çözme (mask -> gerçek değer)
async function decodeDuration(maskedDuration: string, seed: string, userId: string) {
  try {
    const unmasked = unmask(maskedDuration, seed)
    return Number(unmasked) || 0
  } catch (err) {
    console.error('[decodeDuration] Süre çözümlenemedi:', err)
    await saveGlobalErrorLog(
      (err as Error).message,
      'decodeDuration',
      userId,
      (err as Error).stack,
      { maskedDuration, seed },
    )
    return 0
  }
}

//Firestore'a yeni session ekleme
async function addSessionRecord(userId: string, topicId: string, duration: number) {
  const sessionsRef = collection(db, 'users', userId, 'sessions')
  await addDoc(sessionsRef, {
    topicId,
    durationValue: duration,
    date: Timestamp.fromDate(new Date()),
  })
  console.log(`Session kaydedildi! (${duration} ms)`)
}

//Topic verisini güncelleme (toplam süre, seviye vb.)
async function updateTopicStats(userId: string, topicId: string, duration: number) {
  const topicRef = doc(db, 'users', userId, 'topics', topicId)

  await runTransaction(db, async (t) => {
    const snap = await t.get(topicRef)
    if (!snap.exists()) {
      console.warn('[updateTopicStats] Topic bulunamadı:', topicId)
      return
    }

    const data = snap.data()
    const currentTotal = data.totalMs || 0
    const currentCount = data.sessionCount || 0

    const newTotal = currentTotal + duration
    const newCount = currentCount + 1
    const newLevelInfo = LEVELS.filter((l) => newTotal >= l.threshold).pop() ?? LEVELS[0]

    t.update(topicRef, {
      totalMs: newTotal,
      sessionCount: newCount,
      lastSessionAt: serverTimestamp(),
      level: newLevelInfo!.name,
      levelIndex: LEVELS.findIndex((l) => l.name === newLevelInfo!.name),
      updatedAt: serverTimestamp(),
    })
  })

  console.log(`Topic "${topicId}" transaction ile güncellendi.`)
}

//Ana fonksiyon
export async function saveSession(
  userId: string,
  topicId: string,
  maskedDuration: string,
  seed: string,
) {
  try {
    const duration = await decodeDuration(maskedDuration, seed, userId)
    if (duration <= 0) return
    await addSessionRecord(userId, topicId, duration)
    await updateTopicStats(userId, topicId, duration)
  } catch (error) {
    console.error('saveSession hatası:', error)
    await saveGlobalErrorLog(
      (error as Error).message,
      'saveSession',
      userId,
      (error as Error).stack,
      { topicId, maskedDuration },
    )
  }
}
