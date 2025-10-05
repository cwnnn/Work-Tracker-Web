<script setup lang="ts">
import { ref } from 'vue'
import SearchableDropdown from '../components/RcsSoftSearchableDropdown/RcsSearchableDropdown.vue'
import type { DropdownItem } from '../components/RcsSoftSearchableDropdown/SearchableDropdown.interface'
import RcsStopwatch from '../components/RcsStopwatch/RcsStopwatch.vue'
import RcsSoftButton from '@/components/RcsSoftButton/RcsSoftButton.vue'

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

const stopwatchRef = ref<InstanceType<typeof RcsStopwatch> | null>(null)

const startTimer = () => stopwatchRef.value?.start()
const stopTimer = () => stopwatchRef.value?.stop()
const resetTimer = () => stopwatchRef.value?.reset()

/*const getTime = () => {
  const t = stopwatchRef.value?.time
  console.log('Current time:', t)
}*/

const startStopLabel = ref('Start')
const buttonPressed = ref(false)

function resetTimerfunc() {
  resetTimer()
  handlePress(false)
}

function handlePress(pressed: boolean) {
  if (pressed) {
    startTimer()
    startStopLabel.value = 'Stop'
    buttonPressed.value = true
  } else {
    stopTimer()
    startStopLabel.value = 'Start'
    buttonPressed.value = false
  }
}
</script>

<template>
  <main class="min-h-screen p-2 mt-20 flex flex-col md:flex-row md:gap-6">
    <!-- Dropdown: küçük ekranda üste ortalı, büyük ekranda sağa -->
    <div
      class="w-full md:w-auto order-first md:order-last flex justify-center md:justify-end md:mr-10"
    >
      <SearchableDropdown v-model="selected" :items="topics" @create="handleCreate" />
    </div>

    <!-- Stopwatch container: her zaman ortada -->
    <div class="flex-1 flex justify-center">
      <div class="text-center xl:ml-[30vh] md:mt-20">
        <RcsStopwatch ref="stopwatchRef" :initialTime="0" />

        <div class="mt-4 flex gap-6 justify-center">
          <RcsSoftButton
            :label="startStopLabel"
            @press="handlePress"
            :pressed="buttonPressed"
            size="xl"
            class="w-30 md:w-50"
          />
          <RcsSoftButton label="Reset" @click="resetTimerfunc" size="xl" class="w-30 md:w-50" />
          <!--<RcsSoftButton label="Get Time" @click="getTime" size="md" /> -->
        </div>
      </div>
    </div>
  </main>
</template>
