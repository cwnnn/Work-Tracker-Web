<template>
  <main class="min-h-screen mt-20 p-4 grid grid-rows-[5fr_3fr] gap-4">
    <!-- sağ-->
    <div class="grid grid-cols-1 md:grid-cols-[5fr_2fr] gap-4">
      <div class="flex items-start justify-center md:order-2">
        <RcsSearchableDropdown
          v-model="selectedTopic"
          :items="dropdownItems"
          placeholder="Select topic..."
          @create="TopicCreate"
        />
      </div>
      <div class="border border-gray-300 rounded-lg md:order-1">
        <div class="px-6 pt-6">
          <RcsDropdown v-model="selectedWeeklyOption" :items="weeklyDropdownItems" />
        </div>
        <RcsChartLine :chartData="chartData" class="p-6 h-60 md:h-120" />
      </div>
    </div>
    <!-- sol -->
    <div class="grid grid-cols-1 md:grid-cols-[5fr_2fr] gap-4">
      <div class="border border-gray-300 rounded-lg flex items-center justify-center md:order-3">
        bar chart
      </div>
      <div class="border border-gray-300 rounded-lg flex items-center justify-center md:order-4">
        pie chart
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

import RcsSearchableDropdown from '../components/RcsSoftSearchableDropdown/RcsSearchableDropdown.vue'
import RcsChartLine from '../components/RcsChartLine/RcsChartLine.vue'
import RcsDropdown from '../components/RcsDropdown/RcsDropdown.vue'

import { useTopicStore } from '@/stores/topicStore'
import { useUserStore } from '@/stores/userStore'
import { useSeedStore } from '@/stores/seedStore'

import { saveSession, saveGlobalErrorLog } from '@/utils/firebaseUtils'
import { toTitleCase } from '@/utils/TitleCorrUtils'
import { mask } from '@/utils/maskUtils'

const topicStore = useTopicStore()
const userStore = useUserStore()
const seedStore = useSeedStore()

const selectedTopic = ref<{ id: string; label: string } | null>(null)

const selectedWeeklyOption = ref('weekly')
const weeklyDropdownItems = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

const chartData = ref({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Daily Time (minutes)',
      data: [6, 13, 4, 7, 5, 1, 3],
      borderColor: 'MediumPurple',
      tension: 0.3,
    },
  ],
})

const dropdownItems = computed(() =>
  topicStore.topics.map((t) => ({
    id: t.id,
    label: t.topic,
  })),
)

async function TopicCreate(label: string) {
  try {
    if (!userStore.userId) {
      console.error('User ID bulunamadı!')
      return
    }
    const seed = seedStore.seed
    if (!seed) {
      console.error('Seed bulunamadı!')
      return
    }
    await saveSession(null, userStore.userId, toTitleCase(label), mask('0', seed), seed)

    const newTopic = { id: crypto.randomUUID(), topic: toTitleCase(label) }
    topicStore.addTopic(newTopic)
    selectedTopic.value = { id: newTopic.id, label: newTopic.topic }

    console.log('Yeni session oluşturuldu ve topic eklendi:', label)
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err))
    console.error('Yeni topic/session oluşturulamadı:', e)
    await saveGlobalErrorLog(e.message, 'TopicCreate', userStore.userId ?? undefined, e.stack, {
      label,
      seed: seedStore.seed,
      selectedTopic: selectedTopic.value,
    })
  }
}
</script>
