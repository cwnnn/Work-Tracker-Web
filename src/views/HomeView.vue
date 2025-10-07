<script setup lang="ts">
//vue
import { computed, onMounted, ref } from 'vue'
//componenet
import RcsStopwatch from '../components/RcsStopwatch/RcsStopwatch.vue'
import RcsSoftButton from '@/components/RcsSoftButton/RcsSoftButton.vue'
import RcsSearchableDropdown from '../components/RcsSoftSearchableDropdown/RcsSearchableDropdown.vue'
//Stores
import { useUserStore } from '@/stores/userStore'
import { useTopicStore } from '@/stores/topicStore'
//Utils
import { getUserTopics } from '@/utils/firebaseUtils'

const userStore = useUserStore()

const topicStore = useTopicStore()

// DropdownItem tipine uygun hale getiriyoruz
const dropdownItems = computed(() =>
  topicStore.topics.map((t) => ({
    id: t.id,
    label: t.topic,
  })),
)

const selectedTopic = ref<{ id: string; label: string } | null>(null)

function handleCreate(label: string) {
  console.log('Yeni topic oluştur:', label)
}

const stopwatchRef = ref<InstanceType<typeof RcsStopwatch> | null>(null)

const startTimer = () => stopwatchRef.value?.start()
const stopTimer = () => stopwatchRef.value?.stop()
const resetTimer = () => stopwatchRef.value?.reset()

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
onMounted(async () => {
  const topics = await getUserTopics(userStore.userId!)
  topicStore.setTopics(topics)
  console.log('Topic listesi yüklendi:', topics)
})
</script>

<template>
  <main class="min-h-screen p-2 mt-20 flex flex-col md:flex-row md:gap-6">
    <div
      class="w-full md:w-auto order-first md:order-last flex justify-center md:justify-end md:mr-10"
    >
      <RcsSearchableDropdown
        v-model="selectedTopic"
        :items="dropdownItems"
        placeholder="Select topic..."
        @create="handleCreate"
      />
    </div>

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
        </div>
      </div>
    </div>
  </main>
</template>
