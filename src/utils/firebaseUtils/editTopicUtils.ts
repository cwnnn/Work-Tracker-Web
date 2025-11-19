import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { saveGlobalErrorLog } from '@/utils/firebaseUtils/firebaseUtils'

export async function updateTopicName(userId: string, topicId: string, newName: string) {
  if (!userId || !topicId || !newName.trim()) return

  try {
    const topicRef = doc(db, 'users', userId, 'topics', topicId)
    await updateDoc(topicRef, {
      topic: newName.trim(),
      updatedAt: serverTimestamp(),
    })
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      err instanceof Error ? err.message : String(err),
      'updateTopicName',
      userId,
      err instanceof Error ? err.stack : undefined,
      { topicId, newName },
    )
    throw err
  }
}
