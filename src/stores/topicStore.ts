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

  return { topics, setTopics, addTopic, removeTopic }
})
