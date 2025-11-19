<template>
  <div :id="props.id" :class="['stopwatch-container', props.class]" :style="props.style">
    <div class="stopwatch-time">{{ formatTime(displayTime) }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, defineExpose, withDefaults, watch } from 'vue'
import type { StopwatchExpose } from './RcsStopwatch.interface'

const props = withDefaults(
  defineProps<{
    initialTime?: number
    id?: string
    class?: string
    style?: string
  }>(),
  {
    initialTime: 0,
    id: '',
    class: '',
    style: '',
  },
)

//Temel zaman değişkenleri
const initialMs = props.initialTime || 0
const displayTime = ref(initialMs)
const running = ref(false)
let rafId: number | null = null
let startTimestamp = 0

let accumulated = 0

watch(
  () => props.initialTime,
  () => {
    // component duruyorsa sadece görüntü güncellensin
    if (!running.value) {
      updateTime()
    }
  },
)

// Başlat
const start = () => {
  if (running.value) return
  running.value = true
  startTimestamp = Date.now()

  const tick = () => {
    updateTime()
    if (running.value) {
      rafId = requestAnimationFrame(tick)
    }
  }

  rafId = requestAnimationFrame(tick)
}

// Durdur
const stop = () => {
  if (!running.value) return
  running.value = false
  accumulated += Date.now() - startTimestamp
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null
}

const reset = () => {
  stop()
  accumulated = 0
  displayTime.value = props.initialTime || 0
}

// Gerçek zaman hesaplama
const updateTime = () => {
  const base = props.initialTime || 0

  if (running.value) {
    const nowElapsed = Date.now() - startTimestamp
    displayTime.value = base + accumulated + nowElapsed
  } else {
    displayTime.value = base + accumulated
  }
}

// Temizlik
onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})

// Dışarıya expose et
defineExpose<StopwatchExpose>({
  start,
  stop,
  reset,
  get time() {
    // sadece GERÇEK geçen süre, initialTime hariç
    if (running.value) {
      return Math.floor(accumulated + (Date.now() - startTimestamp))
    }
    return Math.floor(accumulated)
  },
})

// Zaman formatlama
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((ms % 1000) / 10)

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`
  }
}
</script>

<style src="./RcsStopwatch.style.css"></style>
