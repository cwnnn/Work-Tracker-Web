import { doc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase'

export async function deleteTopic(userId: string, topicId: string) {
  try {
    const topicRef = doc(db, 'users', userId, 'topics', topicId)
    await deleteDoc(topicRef)

    const sessionsRef = collection(db, 'users', userId, 'sessions')
    const q = query(sessionsRef, where('topicId', '==', topicId))
    const snap = await getDocs(q)

    const batchDeletes: Promise<void>[] = []
    snap.forEach((docSnap) => {
      batchDeletes.push(deleteDoc(docSnap.ref))
    })

    await Promise.all(batchDeletes)

    const statCollections = ['dailyStats', 'weeklyStats', 'monthlyStats', 'yearlyStats']
    for (const col of statCollections) {
      const colRef = collection(db, 'users', userId, col)
      const statQ = query(colRef, where('topicId', '==', topicId))
      const statSnap = await getDocs(statQ)
      const deletes: Promise<void>[] = []
      statSnap.forEach((d) => deletes.push(deleteDoc(d.ref)))
      await Promise.all(deletes)
    }

    console.log(`✅ Topic (${topicId}) ve tüm ilişkili veriler silindi.`)
    return true
  } catch (error) {
    console.error('❌ Topic silme hatası:', error)
    return false
  }
}
