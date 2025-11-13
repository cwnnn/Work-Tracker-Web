import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserTopic } from '../utils/firebaseUtils/firebaseUtils'

export const useTopicStore = defineStore('topic', () => {
  const topics = ref<UserTopic[]>([])

  function setTopics(newTopics: UserTopic[]) {
    topics.value = newTopics
  }

  function addTopic(newTopic: UserTopic) {
    topics.value.push(newTopic)
  }

  function removeTopic(topicId: string) {
    topics.value = topics.value.filter((t) => t.id !== topicId)
    console.log(`🗑 store'dan topic silindi: ${topicId}`)
  }

  function updateTopicName(topicId: string, newName: string) {
    const topic = topics.value.find((t) => t.id === topicId)
    if (topic) {
      topic.topic = newName.trim()
      console.log(`✏️ store'daki topic güncellendi: ${topicId} → ${newName}`)
    } else {
      console.warn(`⚠️ store'da böyle bir topic bulunamadı: ${topicId}`)
    }
  }

  return { topics, setTopics, addTopic, removeTopic, updateTopicName }
})
