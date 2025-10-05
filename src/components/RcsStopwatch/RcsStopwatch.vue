<template>
  <div :id="props.id" :class="['stopwatch-container', props.class]" :style="props.style">
    <div class="stopwatch-time">{{ formatTime(time) }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, defineExpose, withDefaults } from 'vue'
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

const time = ref((props.initialTime || 0) * 1000)
const running = ref(false)
let timer: number | undefined

const start = () => {
  if (!running.value) {
    running.value = true
    timer = setInterval(() => {
      time.value += 10
    }, 10)
  }
}

const stop = () => {
  running.value = false
  if (timer) clearInterval(timer)
}

const reset = () => {
  stop()
  time.value = 0
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

defineExpose<StopwatchExpose>({
  start,
  stop,
  reset,
  get time() {
    return Math.floor(time.value)
  },
})

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
