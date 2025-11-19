// src/stores/seedStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSeed, saveGlobalErrorLog } from '@/utils/firebaseUtils/firebaseUtils'

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
      await saveGlobalErrorLog(
        err instanceof Error ? err.message : String(err),
        'SeedStore.loadSeed',
        undefined,
        err instanceof Error ? err.stack : undefined,
      )
      error.value = err instanceof Error ? err.message : String(err ?? 'Seed yüklenemedi')
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
