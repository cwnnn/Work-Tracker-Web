import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'

export async function updateTopicName(userId: string, topicId: string, newName: string) {
  if (!userId || !topicId || !newName.trim()) {
    console.warn('Eksik parametre: updateTopicName')
    return
  }

  try {
    const topicRef = doc(db, 'users', userId, 'topics', topicId)
    await updateDoc(topicRef, {
      topic: newName.trim(),
      updatedAt: serverTimestamp(),
    })
    console.log(`✅ Topic "${topicId}" başarıyla "${newName}" olarak güncellendi.`)
  } catch (err) {
    console.error('❌ Topic güncelleme hatası:', err)
    throw err
  }
}
