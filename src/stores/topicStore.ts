import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserTopic } from '../utils/firebaseUtils'

export const useTopicStore = defineStore('topic', () => {
  const topics = ref<UserTopic[]>([])

  // topic listesini tamamen değiştir
  function setTopics(newTopics: UserTopic[]) {
    topics.value = newTopics
  }

  // 🔹 yeni topic ekleme metodu
  function addTopic(newTopic: UserTopic) {
    topics.value.push(newTopic)
  }

  return { topics, setTopics, addTopic }
})
