<template>
  <main class="max-h-screen p-2 pt-20 grid gap-4 grid-cols-1 md:grid-cols-[5fr_2fr] md:grid-rows-2">
    <!-- Sol Üst: Line Chart + Dropdown -->

    <section class="p-2 flex flex-col items-center md:order-2">
      <RcsSearchableDropdown
        v-model="selectedTopic"
        :items="dropdownItems"
        placeholder="Select topic..."
        @create="TopicCreate"
      />
    </section>
    <section class="-2xl p-4 flex flex-col justify-between md:order-1">
      <RcsDropdown v-model="selectedWeeklyOption" :items="weeklyDropdownItems" class="pl-6 mb-4" />
      <RcsChartLine :chartData="chartData" class="px-6 h-60 md:h-120" />
    </section>

    <!-- Sağ Üst: Topic Dropdown -->

    <section class="p-4 flex flex-col items-center md:pt-20 md:order-4">
      <RcsChartPie :chartData="chartpieData" />
    </section>

    <!-- Sol Alt: Kartlar -->
    <section class="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:order-3">
      <RcsCard title="Experience Level" value="Master" subtitle="this topic" />
      <RcsCard title="Today’s Focus Time" value="10" subtitle="Hours" />
      <RcsCard title="Average Daily Time" value="7" subtitle="Hours" />
      <RcsCard title="Focus Streak" value="10" subtitle="Days" />
      <RcsCard title="Average Active Hour" value="9 PM" subtitle="Hours" />
      <RcsCard title="Today’s Focus Time" value="3" subtitle="Hours" />
    </section>

    <!-- Sağ Alt: Pie Chart -->
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

import RcsSearchableDropdown from '../components/RcsSoftSearchableDropdown/RcsSearchableDropdown.vue'
import RcsChartLine from '../components/RcsChartLine/RcsChartLine.vue'
import RcsDropdown from '../components/RcsDropdown/RcsDropdown.vue'
import RcsChartPie from '../components/RcsChartPie/RcsChartPie.vue'
import RcsCard from '../components/RcsCard/RcsCard.vue'

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

const chartpieData = {
  labels: ['Work', 'Break', 'Study', 'Other'],
  datasets: [
    {
      label: 'Daily Activities',
      data: [5, 2, 3, 1],
      backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ef4444'],
      borderWidth: 1,
    },
  ],
}

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
