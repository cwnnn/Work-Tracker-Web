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
import { saveGlobalErrorLog } from '../utils/firebaseUtils/firebaseUtils'
import { createTopic, saveSession } from '../utils/firebaseUtils/SaveSessions'
import { mask, unmask } from '../utils/maskUtils'
import { toTitleCase } from '../utils/TitleCorrUtils'
import { releaseWakeLock, requestWakeLock } from '@/utils/wakeLock'
import { getTodayFromMonthlyLite } from '@/utils/firebaseUtils/AggregationUtils'

// store'ları başlat
const userStore = useUserStore()
const topicStore = useTopicStore()
const seedStore = useSeedStore()

/* -----------------------------
   🔹 DROPDOWN (selectedTopic)
------------------------------ */
const selectedTopic = ref<{ id: string; label: string } | null>(null)

const dropdownItems = computed(() =>
  topicStore.topics.map((t) => ({
    id: t.id,
    label: t.topic,
  })),
)

async function TopicCreate(label: string) {
  try {
    const userId = userStore.userId
    if (!userId) return

    const topicName = toTitleCase(label)
    const topic = await createTopic(userId, topicName)

    const newTopic = { id: topic.topicId, topic: topicName }
    topicStore.addTopic(newTopic)

    selectedTopic.value = { id: newTopic.id, label: newTopic.topic }
  } catch (error: unknown) {
    const e = error instanceof Error ? error : new Error(String(error))
    await saveGlobalErrorLog(e.message, 'TopicCreate', userStore.userId ?? undefined, e.stack, {
      label,
    })
  }
}

/* Kayıt algoritması için LOCAL_KEY */
const LOCAL_KEY = ref<string>('noTopic')

watch(selectedTopic, (newVal, oldVal) => {
  if (!newVal) return
  if (!oldVal || newVal.id !== oldVal.id) {
    const seed = seedStore.seed
    if (!seed) return

    const maskedId = mask(newVal.id, seed)
    LOCAL_KEY.value = `topic_${maskedId}`
    resetTimerfunc()
  }
})

/* -----------------------------
   🔹 STOPWATCH
------------------------------ */
const stopwatchRef = ref<InstanceType<typeof RcsStopwatch> | null>(null)
const startStopLabel = ref('Start')
const buttonPressed = ref(false)

const startTimer = () => stopwatchRef.value?.start()
const stopTimer = () => stopwatchRef.value?.stop()
const resetTimer = () => stopwatchRef.value?.reset()

/* -----------------------------
   🔹 RESET / LOAD BUTONLARI
------------------------------ */
const resetButtonLabel = ref('Load Today')
const isResetButtonLoad = ref(true)
const getTodayFocusMS = ref(0)
const cachedTodayMs = ref<number | null>(null)

watch(isResetButtonLoad, (newVal) => {
  resetButtonLabel.value = newVal ? 'Load Today' : 'Reset'
})

async function ResetOrLoad() {
  if (isResetButtonLoad.value) {
    if (cachedTodayMs.value === null && userStore.userId && selectedTopic.value) {
      const ms = await getTodayFromMonthlyLite(userStore.userId!, selectedTopic.value!.id)
      cachedTodayMs.value = ms

      isResetButtonLoad.value = false
    }

    getTodayFocusMS.value = cachedTodayMs.value!
    previousTime.value = 0
  } else {
    getTodayFocusMS.value = 0
    resetTimerfunc()
  }
}

/* -----------------------------
   🔹 AUTO-SAVE (LocalStorage + Masking)
------------------------------ */
function saveAccumulatedTime(time?: number) {
  if (!selectedTopic.value) return

  const seed = seedStore.seed
  if (!seed) {
    return
  }

  const value = time?.toString() || '0'
  const masked = mask(value, seed)
  localStorage.setItem(LOCAL_KEY.value, masked)
}

const previousTime = ref<number>(0)

function computedAccumulatedTime() {
  if (!stopwatchRef.value || stopwatchRef.value.time <= 0) return

  const delta = stopwatchRef.value.time - previousTime.value
  previousTime.value = stopwatchRef.value.time

  const seed = seedStore.seed
  if (!seed) return

  const stored = localStorage.getItem(LOCAL_KEY.value)
  if (!stored) {
    saveAccumulatedTime(delta)

    return
  }

  let total = 0
  try {
    const unmasked = unmask(stored, seed)
    total = Number(unmasked) || 0
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err))

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
    ).catch()
  }

  const newTotal = total + delta
  saveAccumulatedTime(newTotal)
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

/* -----------------------------
   🔹 START / STOP (press event)
------------------------------ */
function toggleTracking(value: boolean) {
  if (value) {
    if (selectedTopic.value) startAutoSave()
  } else {
    stopAutoSave()
  }
}

async function handlePress(pressed: boolean) {
  toggleTracking(pressed)

  if (pressed) {
    isResetButtonLoad.value = false
    requestWakeLock()
    startTimer()
    startStopLabel.value = 'Stop'
    buttonPressed.value = true
  } else {
    releaseWakeLock()
    stopTimer()
    startStopLabel.value = 'Start'
    buttonPressed.value = false

    const masked = localStorage.getItem(LOCAL_KEY.value)
    if (masked && userStore.userId && selectedTopic.value) {
      const seed = seedStore.seed
      if (!seed) {
        return
      }

      let time = 0
      try {
        const unmasked = unmask(masked, seed)
        time = Number(unmasked) || 0
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err))

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

      if (time > 1000) {
        try {
          await saveSession(userStore.userId, selectedTopic.value.id, masked, seed)
          localStorage.removeItem(LOCAL_KEY.value)
        } catch (err: unknown) {
          const e = err instanceof Error ? err : new Error(String(err))

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

function resetTimerfunc() {
  resetTimer()
  handlePress(false)
  previousTime.value = 0
  isResetButtonLoad.value = true
}

onUnmounted(() => {
  stopAutoSave()
})
</script>

<template>
  <main class="relative min-h-screen flex flex-col md:flex-row">
    <!-- 🔹 DROPDOWN: Sağ üstte absolute -->
    <div class="absolute top-20 right-16">
      <RcsSearchableDropdown
        v-model="selectedTopic"
        :items="dropdownItems"
        placeholder="Select topic..."
        @create="TopicCreate"
      />
    </div>

    <!-- 🔹 STOPWATCH TAM ORTADA -->
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <RcsStopwatch ref="stopwatchRef" :initialTime="getTodayFocusMS" />

        <div class="mt-4 flex gap-6 justify-center">
          <RcsSoftButton
            :label="startStopLabel"
            @press="handlePress"
            :pressed="buttonPressed"
            size="xl"
            class="w-30 md:w-50"
          />
          <RcsSoftButton
            :label="resetButtonLabel"
            @click="ResetOrLoad()"
            size="xl"
            class="w-30 md:w-50"
          />
        </div>
      </div>
    </div>
  </main>
</template>
