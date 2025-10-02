<script setup lang="ts">
import { ref } from 'vue'
import SearchableDropdown from '../components/RcsSoftSearchableDropdown/RcsSearchableDropdown.vue'
import type { DropdownItem } from '../components/RcsSoftSearchableDropdown/SearchableDropdown.interface'

const topics = ref<DropdownItem[]>([
  { id: '1', label: 'Matematik' },
  { id: '2', label: 'Fizik' },
  { id: '3', label: 'Kimya' },
])

const selected = ref<DropdownItem | null>(null)

function handleCreate(newLabel: string) {
  const newItem = { id: Date.now().toString(), label: newLabel }
  topics.value.push(newItem)
  selected.value = newItem
}
</script>

<template>
  <main
    class="flex flex-col md:flex-row items-center md:items-start justify-between min-h-screen p-4 sm:p-8 gap-6 pt-20 md:pt-20 md:text-lg"
  >
    <!-- Dropdown: küçük ekranda üste ortalı, büyük ekranda sağa -->
    <div class="w-full md:w-auto order-first md:order-last flex justify-center md:justify-end">
      <SearchableDropdown
        v-model="selected"
        :items="topics"
        placeholder="Konu ara veya ekle..."
        @create="handleCreate"
      />
    </div>

    <!-- Sol taraf: Başlık ve açıklama -->
    <div class="flex flex-col items-center md:items-start max-w-xl text-center md:text-left">
      <h1 class="text-3xl sm:text-4xl font-bold mb-4">Welcome to the Home Page</h1>
      <p class="text-base sm:text-lg">
        This is the home view of the application. Use the navigation links to explore different
        sections.
      </p>
    </div>
  </main>
</template>
