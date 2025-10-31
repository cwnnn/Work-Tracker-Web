<template>
  <div class="dropdown-wrapper">
    <button @click="open = !open" class="dropdown-button">
      {{ selectedItem?.label || 'Select' }}
      <span>▼</span>
    </button>

    <ul v-if="open" class="dropdown-menu-ul">
      <li
        v-for="item in props.items"
        :key="item.value"
        @click="select(item)"
        class="dropdown-menu-li"
      >
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>

<style src="./RcsDropdown.css"></style>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ items: { label: string; value: string }[] }>()
const emits = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const open = ref(false)
const selectedItem = ref<{ label: string; value: string } | null>(null)

function select(item: { label: string; value: string }) {
  selectedItem.value = item
  emits('update:modelValue', item.value)
  open.value = false
}
</script>
