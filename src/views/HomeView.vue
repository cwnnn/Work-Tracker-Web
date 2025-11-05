<script setup lang="ts">
//vue
import { ref, computed, onUnmounted, watch } from 'vue'

//component
import RcsStopwatch from '../components/RcsStopwatch/RcsStopwatch.vue'
import RcsSoftButton from '../components/RcsSoftButton/RcsSoftButton.vue'
import RcsSearchableDropdown from '../components/RcsSoftSearchableDropdown/RcsSearchableDropdown.vue'
//stores
import { useUserStore } from '../stores/userStore'
import { useTopicStore } from '../stores/topicStore'
import { useSeedStore } from '../stores/seedStore'
//utils
import { saveGlobalErrorLog } from '../utils/firebaseUtils'
import { createTopic, saveSession } from '../utils/firebaseUtils/SaveSessions'
import { mask, unmask } from '../utils/maskUtils'
import { toTitleCase } from '../utils/TitleCorrUtils'

// store'ları başlat
const userStore = useUserStore()
const topicStore = useTopicStore()
const seedStore = useSeedStore()

// dropdown item'ları computed olarak al
const dropdownItems = computed(() =>
  topicStore.topics.map((t) => ({
    id: t.id,
    label: t.topic,
  })),
)

const selectedTopic = ref<{ id: string; label: string } | null>(null)

//Yeni topic oluşturma fonksiyonu
async function TopicCreate(label: string) {
  try {
    const userId = userStore.userId
    if (!userId) {
      console.error('User ID bulunamadı!')
      return
    }

    const topicName = toTitleCase(label)
    const topic = await createTopic(userId, topicName)

    // store’a ekle
    const newTopic = { id: topic.topicId, topic: topicName }
    topicStore.addTopic(newTopic)

    // seçili topic olarak ata
    selectedTopic.value = { id: newTopic.id, label: newTopic.topic }

    console.log(`Yeni topic oluşturuldu: ${topicName}`)
  } catch (error: unknown) {
    const e = error instanceof Error ? error : new Error(String(error))
    console.error('Topic oluşturulamadı:', e)
    await saveGlobalErrorLog(e.message, 'TopicCreate', userStore.userId ?? undefined, e.stack, {
      label,
    })
  }
}

// Stopwatch ref'leri ve kontrol fonksiyonları
const stopwatchRef = ref<InstanceType<typeof RcsStopwatch> | null>(null)
const startStopLabel = ref('Start')
const buttonPressed = ref(false)

const startTimer = () => stopwatchRef.value?.start()
const stopTimer = () => stopwatchRef.value?.stop()
const resetTimer = () => stopwatchRef.value?.reset()

function resetTimerfunc() {
  resetTimer()
  handlePress(false)
  previousTime.value = 0
}

/* kayıt algoritması açıklaması */
const LOCAL_KEY = ref<string>('noTopic')

function saveAccumulatedTime(time?: number) {
  if (!selectedTopic.value) return

  const seed = seedStore.seed
  if (!seed) {
    console.warn('[saveAccumulatedTime] Seed henüz yüklenmedi, kayıt atlandı.')
    return
  }

  const value = time?.toString() || '0'
  const masked = mask(value, seed)
  localStorage.setItem(LOCAL_KEY.value, masked)
  console.log(localStorage.getItem(LOCAL_KEY.value))
}
const previousTime = ref<number>(0)

function computedAccumulatedTime() {
  if (!stopwatchRef.value || stopwatchRef.value.time <= 0) return

  const delta = stopwatchRef.value.time - previousTime.value
  previousTime.value = stopwatchRef.value.time

  const seed = seedStore.seed
  if (!seed) return console.warn('[computedAccumulatedTime] Seed henüz yüklenmedi, kayıt atlandı.')

  const stored = localStorage.getItem(LOCAL_KEY.value)
  if (!stored) {
    saveAccumulatedTime(delta)
    console.log('İlk kayıt. Toplam süre (ms):', delta)
    return
  }

  let total = 0
  try {
    const unmasked = unmask(stored, seed)
    total = Number(unmasked) || 0
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err))
    console.error('[computedAccumulatedTime] Kayıt çözümlenemedi:', e)
    localStorage.removeItem(LOCAL_KEY.value)
    total = 0
    saveGlobalErrorLog(
      e.message,
      'computedAccumulatedTime',
      userStore.userId ?? undefined,
      e.stack,
      {
        stored,
        localKey: LOCAL_KEY.value,
        seed,
        selectedTopic: selectedTopic.value,
      },
    ).catch(console.error)
  }

  const newTotal = total + delta
  saveAccumulatedTime(newTotal)
  console.log('Kayıt edildi. Toplam süre (ms):', newTotal)
}

let intervalId: number | null = null

function startAutoSave() {
  stopAutoSave()
  previousTime.value = stopwatchRef.value?.time || 0

  intervalId = window.setInterval(async () => {
    try {
      computedAccumulatedTime()
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err))
      console.error('[startAutoSave] Otomatik kayıt hatası:', e)
      await saveGlobalErrorLog(e.message, 'startAutoSave', userStore.userId ?? undefined, e.stack, {
        selectedTopic: selectedTopic.value,
        seed: seedStore.seed,
        localKey: LOCAL_KEY.value,
      })
    }
  }, 1 * 1000)
}

async function stopAutoSave() {
  try {
    computedAccumulatedTime()
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err))
    console.error('[stopAutoSave] Durdurma sırasında hata:', e)
    await saveGlobalErrorLog(e.message, 'stopAutoSave', userStore.userId ?? undefined, e.stack, {
      selectedTopic: selectedTopic.value,
      seed: seedStore.seed,
      localKey: LOCAL_KEY.value,
    })
  }

  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function toggleTracking(value: boolean) {
  if (value) {
    console.log('Takip başladı...')
    if (selectedTopic.value) {
      startAutoSave()
    }
  } else {
    console.log('Takip durdu.')
    stopAutoSave()
  }
}

onUnmounted(() => {
  stopAutoSave()
})

async function handlePress(pressed: boolean) {
  toggleTracking(pressed)
  if (pressed) {
    startTimer()
    startStopLabel.value = 'Stop'
    buttonPressed.value = true
  } else {
    stopTimer()
    startStopLabel.value = 'Start'
    buttonPressed.value = false
    const masked = localStorage.getItem(LOCAL_KEY.value)
    if (masked && userStore.userId && selectedTopic.value) {
      const seed = seedStore.seed
      if (!seed) {
        console.warn('[saveSession] Seed henüz yüklenmedi, kayıt atlandı.')
        return
      }

      let time = 0
      try {
        const unmasked = unmask(masked, seed)
        time = Number(unmasked) || 0
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err))
        console.error('[saveSession] Süre çözümlenemedi:', e)
        await saveGlobalErrorLog(
          e.message,
          'handlePress (Stop)',
          userStore.userId ?? undefined,
          e.stack,
          {
            masked,
            seed,
            selectedTopic: selectedTopic.value,
            localKey: LOCAL_KEY.value,
          },
        )
        return
      }

      if (time > 60 * 1000) {
        try {
          await saveSession(userStore.userId, selectedTopic.value.id, masked, seed)
          localStorage.removeItem(LOCAL_KEY.value)
        } catch (err: unknown) {
          const e = err instanceof Error ? err : new Error(String(err))
          console.error('[handlePress] saveSession hatası:', e)
          await saveGlobalErrorLog(
            e.message,
            'handlePress (saveSession)',
            userStore.userId ?? undefined,
            e.stack,
            {
              time,
              masked,
              seed,
              topic: selectedTopic.value,
            },
          )
        }
      }
    }
  }
}

watch(selectedTopic, (newVal, oldVal) => {
  if (!newVal) return
  if (!oldVal || newVal.id !== oldVal.id) {
    const seed = seedStore.seed
    if (!seed) return console.warn('Seed bulunamadı (LOCAL_KEY oluşturulamadı).')

    const maskedId = mask(newVal.id, seed)
    LOCAL_KEY.value = `topic_${maskedId}`
    resetTimerfunc()
  }
})
</script>

<template>
  <main class="min-h-screen p-2 mt-20 flex flex-col md:flex-row md:gap-6">
    <div
      class="w-full md:w-auto order-first md:order-last flex justify-center md:justify-end md:mr-10"
    >
      <RcsSearchableDropdown
        v-model="selectedTopic"
        :items="dropdownItems"
        placeholder="Select topic..."
        @create="TopicCreate"
      />
    </div>

    <div class="flex-1 flex justify-center">
      <div class="text-center xl:ml-[30vh] md:mt-20">
        <RcsStopwatch ref="stopwatchRef" :initialTime="0" />

        <div class="mt-4 flex gap-6 justify-center">
          <RcsSoftButton
            :label="startStopLabel"
            @press="handlePress"
            :pressed="buttonPressed"
            size="xl"
            class="w-30 md:w-50"
          />
          <RcsSoftButton label="Reset" @click="resetTimerfunc" size="xl" class="w-30 md:w-50" />
        </div>
      </div>
    </div>
  </main>
</template>
