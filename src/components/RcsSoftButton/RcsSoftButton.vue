<template>
  <button
    :id="props.id"
    :class="[
      'btn btn--soft',
      `btn--${props.size}`,
      { 'btn--disabled': props.disabled, 'btn--pressed': props.pressed },
      props.class,
    ]"
    :style="props.style"
    :aria-pressed="pressed"
    :disabled="props.disabled"
    @click="handleClick"
  >
    <span v-if="props.icon" class="btn__icon" aria-hidden="true">{{ props.icon }}</span>
    <span class="btn__label">{{ props.label }}</span>
  </button>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, withDefaults, watch } from 'vue'
import type { ButtonProps } from './RcsSoftButton.interface'
import './RcsSoftButton.styles.css'

const props = withDefaults(defineProps<ButtonProps>(), {
  label: 'Button',
  size: 'md',
  disabled: false,
  icon: '',
  pressed: false,
  id: '',
  class: '',
  style: '',
})

const emits = defineEmits<{
  (e: 'click', ev: MouseEvent): void
  (e: 'press', pressed: boolean): void
}>()

const pressed = ref(props.pressed)

watch(
  () => props.pressed,
  (val) => {
    pressed.value = val
  },
)

function handleClick(ev: MouseEvent) {
  if (props.disabled) return
  pressed.value = !pressed.value
  emits('click', ev)
  emits('press', pressed.value)
}
</script>
