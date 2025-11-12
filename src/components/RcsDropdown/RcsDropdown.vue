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
        :class="['dropdown-menu-li', item.premium ? 'dropdown-premium' : '']"
      >
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DropdownItem } from './RcsDropdown.interface'

const props = defineProps<{
  items: DropdownItem[]
  modelValue: string
}>()

const emits = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const open = ref(false)
const selectedItem = ref<DropdownItem | null>(null)

selectedItem.value = props.items.find((i) => i.value === props.modelValue) ?? null

watch(
  () => props.modelValue,
  (newVal) => {
    selectedItem.value = props.items.find((i) => i.value === newVal) ?? null
  },
)

function select(item: DropdownItem) {
  selectedItem.value = item
  emits('update:modelValue', item.value)
  open.value = false
}
</script>

<style src="./RcsDropdown.css"></style>
