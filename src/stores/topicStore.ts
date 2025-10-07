import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserTopic } from '../utils/firebaseUtils'

export const useTopicStore = defineStore('topic', () => {
  const topics = ref<UserTopic[]>([])

  function setTopics(newTopics: UserTopic[]) {
    topics.value = newTopics
  }

  return { topics, setTopics }
})
