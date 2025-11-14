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
    <slot v-if="$slots.default"></slot>

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
const props = defineProps({
  id: String,
  label: String,
  icon: String,
  size: {
    type: String,
    default: 'md',
  },
  disabled: Boolean,
  pressed: Boolean,
  class: String,
  style: String,
})

const emit = defineEmits(['click'])

function handleClick(e: Event) {
  if (!props.disabled) emit('click', e)
}
</script>
<style src="./RcsSoftButton.styles.css"></style>
