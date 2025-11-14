// src/utils/firebaseUtils/feedbackUtils.ts
import { db } from '@/firebase'
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'

//Tipler
export type FeedbackType = 'feedback' | 'suggestion' | 'bug'
export type FeedbackStatus = 'new' | 'seen' | 'done'

export interface FeedbackPayload {
  type: FeedbackType
  message: string
  userId?: string | null
  userAgent?: string
  platform?: string
}

export interface FeedbackItem {
  id: string
  type: FeedbackType
  message: string
  userId: string | null
  userAgent: string
  platform: string
  createdAt: Timestamp | null
  status: FeedbackStatus
}

/* ------------------------------------------------------
 📨 1) Feedback Kaydetme
------------------------------------------------------- */
export async function sendFeedback(payload: FeedbackPayload) {
  const feedbackRef = collection(db, 'feedback')

  const docRef = await addDoc(feedbackRef, {
    type: payload.type,
    message: payload.message,
    userId: payload.userId || null,
    userAgent: payload.userAgent || navigator.userAgent,
    platform: payload.platform || navigator.platform,
    status: 'new' as FeedbackStatus,
    createdAt: serverTimestamp(),
  })

  return docRef.id
}

// Admin Panel: Bütün Feedbackleri Getir

export async function getAllFeedback(): Promise<FeedbackItem[]> {
  const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)

  const list: FeedbackItem[] = []

  snap.forEach((docSnap) => {
    const data = docSnap.data()

    const item: FeedbackItem = {
      id: docSnap.id,
      type: data.type as FeedbackType,
      message: data.message,
      userId: data.userId ?? null,
      userAgent: data.userAgent ?? '',
      platform: data.platform ?? '',
      createdAt: data.createdAt ?? null,
      status: data.status as FeedbackStatus,
    }

    list.push(item)
  })

  return list
}

// Durum Güncelleme
export async function updateFeedbackStatus(id: string, status: FeedbackStatus) {
  const ref = doc(db, 'feedback', id)
  await updateDoc(ref, { status })
}
