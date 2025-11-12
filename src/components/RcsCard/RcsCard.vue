<template>
  <div
    class="RcsCard relative"
    :class="props.size"
    :style="props.style"
    :id="props.id"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- Header -->
    <div class="card-header">
      <h3 :class="['card-title truncate', props.premium ? 'card-premium' : '']">
        {{ props.title }}
      </h3>
      <slot name="icon"></slot>
    </div>

    <!-- Body -->
    <div class="card-body">
      <p class="card-value text-balance" :class="{ 'alarm-blink': props.alarm }">
        {{ props.value }}
      </p>
      <p v-if="props.subtitle" class="card-subtitle truncate">{{ props.subtitle }}</p>
    </div>

    <!-- Info tooltip -->
    <transition name="fade">
      <div v-if="showInfo && props.info" class="card-info">
        {{ props.info }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { RcsStatCardProps } from './RcsCard.interface'

const props = withDefaults(defineProps<RcsStatCardProps>(), {
  size: 'md',
})

const showInfo = ref(false)
let idleTimer: number | null = null

function onMouseMove() {
  if (!props.info) return
  showInfo.value = false
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = window.setTimeout(() => (showInfo.value = true), 500)
}

function onMouseLeave() {
  if (!props.info) return
  showInfo.value = false
  if (idleTimer) clearTimeout(idleTimer)
}
</script>

<style src="./RcsCard.css"></style>
