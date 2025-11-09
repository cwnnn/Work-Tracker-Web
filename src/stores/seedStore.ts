// src/stores/seedStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSeed } from '@/utils/firebaseUtils/firebaseUtils' // az önce yazdığın fonksiyon

export const useSeedStore = defineStore('seed', () => {
  const seed = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  function setSeed(newSeed: string | null) {
    seed.value = newSeed
  }

  async function loadSeed() {
    try {
      isLoading.value = true
      const result = await getSeed()
      if (result) {
        seed.value = result.value
      } else {
        error.value = 'Seed bulunamadı'
      }
    } catch (err: unknown) {
      console.error('Seed yüklenemedi:', err)
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = String(err ?? 'Seed yüklenemedi')
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    seed,
    isLoading,
    error,
    setSeed,
    loadSeed,
  }
})
