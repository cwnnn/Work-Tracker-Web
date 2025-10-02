<template>
  <div class="dropdown" :id="props.id" :class="props.class" :style="props.style">
    <!-- Kapalı halde -->
    <div class="dropdown-selected" @click="toggleDropdown">
      {{ props.modelValue?.label || props.placeholder || 'Select or Create...' }}
      <span class="ml-auto">▾</span>
    </div>

    <!-- Açık halde -->
    <div class="dropdown-panel" v-if="isOpen">
      <div class="dropdown-search">
        <input v-model="query" placeholder="Search..." class="dropdown-input" />
      </div>
      <ul class="dropdown-list">
        <li
          v-for="item in filteredItems"
          :key="item.id"
          @click="selectItem(item)"
          class="dropdown-item"
          :class="{ 'dropdown-pressed': props.modelValue?.id === item.id }"
        >
          {{ item.label }}
        </li>

        <li v-if="query" @click="createNew" class="dropdown-create">+ Create "{{ query }}"</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DropdownItem, SearchableDropdownProps } from './SearchableDropdown.interface'
import './RcsSearchableDropdown.style.css'

const props = defineProps<SearchableDropdownProps>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: DropdownItem | null): void
  (e: 'create', value: string): void
}>()

const isOpen = ref(false)
const query = ref('')

const filteredItems = computed(() =>
  props.items.filter((item) => item.label.toLowerCase().includes(query.value.toLowerCase())),
)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectItem(item: DropdownItem) {
  emit('update:modelValue', item)
  isOpen.value = false
  query.value = ''
}

function createNew() {
  emit('create', query.value)
  isOpen.value = false
  query.value = ''
}
</script>
