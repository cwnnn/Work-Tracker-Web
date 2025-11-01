<template>
  <div class="RcsCard" :class="[props.class, sizeClass]" :style="props.style" :id="props.id">
    <div class="card-header">
      <h3 class="card-title">{{ props.title }}</h3>
      <slot name="icon"></slot>
    </div>
    <div class="card-body">
      <p class="card-value">{{ props.value }}</p>
      <p v-if="props.subtitle" class="card-subtitle">{{ props.subtitle }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RcsStatCardProps } from './RcsCard.interface'
const props = defineProps<RcsStatCardProps>()

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'RcsCard--sm'
    case 'lg':
      return 'RcsCard--lg'
    default:
      return 'RcsCard--md'
  }
})
</script>

<style src="./RcsCard.css"></style>
