<template>
  <button
    :class="['btn', `btn--soft`, `btn--${size}`, { 'btn--disabled': disabled }]"
    :aria-pressed="pressed"
    :disabled="disabled"
    @click="handleClick"
  >
    <span v-if="icon" class="btn__icon" aria-hidden="true">{{ icon }}</span>
    <span class="btn__label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue'
import type { ButtonProps } from './RcsSoftButton.interface'
import './RcsSoftButton.styles.css'

// Props ile default değerleri burada veriyoruz
const props = defineProps<ButtonProps>()

const label = props.label ?? 'Button'
const size = props.size ?? 'md'
const disabled = props.disabled ?? false
const icon = props.icon ?? ''

const emits = defineEmits<{
  (e: 'click', ev: MouseEvent): void
  (e: 'press', pressed: boolean): void
}>()

const pressed = ref(false)

function handleClick(ev: MouseEvent) {
  if (disabled) return
  emits('click', ev)
  pressed.value = !pressed.value
  emits('press', pressed.value)
}
</script>
