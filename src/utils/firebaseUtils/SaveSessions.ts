import { db } from '@/firebase'
import {
  addDoc,
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { saveGlobalErrorLog } from './firebaseUtils'
import { unmask } from '../maskUtils'
import { updatePeakFocusSession } from '../firebaseUtilsCard/firebaseUtilsCard'
import {
  updateDailyStatsLite,
  updateWeeklyStatsLite,
  updateMonthlyStatsLite,
  updateYearlyStatsLite,
} from './AggregationUtils'

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
    return { topicId, ...payload }
  } catch (error) {
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
  try {
    const sessionsRef = collection(db, 'users', userId, 'sessions')
    await addDoc(sessionsRef, {
      topicId,
      durationValue: duration,
      date: Timestamp.fromDate(new Date()),
    })
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      err instanceof Error ? err.message : 'addSessionRecord error',
      'addSessionRecord',
      userId,
      err instanceof Error ? err.stack : undefined,
      { topicId, duration },
    )
    throw err
  }
}

//Topic verisini güncelleme (toplam süre, seviye vb.)
async function updateTopicStats(userId: string, topicId: string, duration: number) {
  try {
    const topicRef = doc(db, 'users', userId, 'topics', topicId)

    await runTransaction(db, async (t) => {
      const snap = await t.get(topicRef)
      if (!snap.exists()) return

      const data = snap.data()
      const newTotal = (data.totalMs || 0) + duration
      const newCount = (data.sessionCount || 0) + 1
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
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      err instanceof Error ? err.message : 'updateTopicStats error',
      'updateTopicStats',
      userId,
      err instanceof Error ? err.stack : undefined,
      { topicId, duration },
    )
    throw err
  }
}

async function updateAllTopicsTotalFocus(userId: string, deltaMs: number) {
  try {
    const statsRef = doc(db, 'users', userId, 'stats', 'allTopics')
    await setDoc(
      statsRef,
      {
        totalFocusMs: increment(deltaMs),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      err instanceof Error ? err.message : 'updateAllTopicsTotalFocus error',
      'updateAllTopicsTotalFocus',
      userId,
      err instanceof Error ? err.stack : undefined,
      { deltaMs },
    )
    throw err
  }
}

//Ana fonksiyon
export async function saveSession(
  userId: string,
  topicId: string,
  maskedDuration: string,
  seed: string,
) {
  try {
    const durationMs = await decodeDuration(maskedDuration, seed, userId)
    if (durationMs <= 0) return

    const endDate = new Date()

    // 1️⃣ Session kaydı oluştur
    await addSessionRecord(userId, topicId, durationMs)

    // 2️⃣ Konu istatistiklerini güncelle
    await updateTopicStats(userId, topicId, durationMs)

    // 3️⃣ Tüm konuların toplam odak süresi (allTopics)
    await updateAllTopicsTotalFocus(userId, durationMs)

    // 4️⃣ En yüksek oturum süresi (peak)
    await updatePeakFocusSession(userId, durationMs)

    // 5️⃣ Daily, Weekly, Monthly, Yearly istatistikleri paralel güncelle
    await Promise.all([
      updateDailyStatsLite(userId, topicId, durationMs, endDate),
      updateWeeklyStatsLite(userId, topicId, durationMs, endDate),
      updateMonthlyStatsLite(userId, topicId, durationMs, endDate),
      updateYearlyStatsLite(userId, topicId, durationMs, endDate),
    ])
  } catch (error) {
    await saveGlobalErrorLog(
      (error as Error).message,
      'saveSession',
      userId,
      (error as Error).stack,
      { topicId, maskedDuration },
    )
  }
}
