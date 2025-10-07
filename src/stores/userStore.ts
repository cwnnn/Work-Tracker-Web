import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const userId = ref<string | null>(null)

  function setUser(id: string | null) {
    userId.value = id
  }

  return { userId, setUser }
})
