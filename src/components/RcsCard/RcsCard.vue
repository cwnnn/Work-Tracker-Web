<template>
  <div class="RcsCard" :class="props.size" :style="props.style" :id="props.id">
    <div class="card-header">
      <h3 class="card-title truncate">{{ props.title }}</h3>
      <slot name="icon"></slot>
    </div>

    <div class="card-body">
      <p class="card-value text-balance">{{ props.value }}</p>
      <p v-if="props.subtitle" class="card-subtitle truncate">{{ props.subtitle }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RcsStatCardProps } from './RcsCard.interface'
const props = withDefaults(defineProps<RcsStatCardProps>(), {
  size: 'md',
})
</script>

<style src="./RcsCard.css"></style>
