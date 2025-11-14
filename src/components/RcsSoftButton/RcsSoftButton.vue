<template>
  <button
    :id="props.id"
    :class="[
      'btn btn--soft',
      `btn--${props.size}`,
      { 'btn--disabled': props.disabled, 'btn--pressed': pressed },
      props.class,
    ]"
    :style="props.style"
    :aria-pressed="pressed"
    :disabled="props.disabled"
    @click="handleClick"
  >
    <!-- Eğer dışardan slot gönderilmişse onu kullan -->
    <template v-if="$slots.default && $slots.default().length > 0">
      <slot></slot>
    </template>

    <!-- Slot yoksa default yapı -->
    <template v-else>
      <span v-if="props.icon" class="btn__icon" aria-hidden="true">
        {{ props.icon }}
      </span>

      <span v-if="props.label" class="btn__label">
        {{ props.label }}
      </span>
    </template>
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

// Sadece props'u yansıtıyoruz, kendimiz toggle etmiyoruz
const pressed = ref(props.pressed)

watch(
  () => props.pressed,
  (val) => {
    pressed.value = val
  },
)

/**
 * Artık burada pressed.value = !pressed.value YOK
 * Sadece parent'a haber veriyoruz.
 */
function handleClick(ev: MouseEvent) {
  if (props.disabled) return

  emits('click', ev)
  emits('press', !pressed.value) // parent isterse kullanır
}
</script>
