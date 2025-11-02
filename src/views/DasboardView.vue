<template>
  <main class="max-h-screen p-2 pt-20 grid gap-4 grid-cols-1 md:grid-cols-[5fr_2fr] md:grid-rows-2">
    <section class="p-2 flex flex-col items-center md:order-2">
      <RcsSearchableDropdown
        v-model="selectedTopic"
        :items="dropdownItems"
        placeholder="Select topic..."
        @create="TopicCreate"
      />
      <button @click="getdaily">test</button>
    </section>
    <section class="-2xl p-4 flex flex-col justify-between md:order-1">
      <RcsDropdown v-model="selectedWeeklyOption" :items="weeklyDropdownItems" class="pl-6 mb-4" />
      <RcsChartLine :chartData="chartData" class="px-6 h-60 md:h-120" />
    </section>

    <section class="p-4 flex flex-col items-center md:pt-10 md:order-4">
      <RcsChartPie :chartData="chartpieData" />
    </section>

    <section class="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:order-3">
      <RcsCard title="Experience Level" value="Master" subtitle="this topic" />
      <RcsCard title="Today’s Focus Time" value="10" subtitle="Hours" />
      <RcsCard title="Average Daily Time" value="7" subtitle="Hours" />
      <RcsCard title="Focus Streak" value="10" subtitle="Days" />
      <RcsCard title="Average Active Hour" value="9 PM" subtitle="Hours" />
      <RcsCard title="Today’s Focus Time" value="3" subtitle="Hours" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

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
import { getTodaySessionsByTopic } from '@/utils/firebaseUtilsDashboard'

const topicStore = useTopicStore()
const userStore = useUserStore()
const seedStore = useSeedStore()
const weeklyTotal = ref()
const selectedTopic = ref<{ id: string; label: string } | null>(null)

// seçili seçenek
const selectedWeeklyOption = ref('daily')

const chartData = ref({
  labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
  datasets: [
    {
      label: 'Focus Time (minutes)',
      data: Array(24).fill(0),
      borderWidth: 2,
      tension: 0.3,
    },
  ],
})

// chart'ı güncelleyen fonksiyon
async function updateChart() {
  const userId = userStore.userId
  const topicId = selectedTopic.value!.id
  if (!userId || !topicId) return console.warn('Kullanıcı veya topic eksik.')

  if (selectedWeeklyOption.value === 'daily') {
    const hours = await getTodaySessionsByTopic(userId, topicId)
    chartData.value.labels = hours.map((h) => `${h.id}:00`)
    chartData.value.datasets[0]!.data = hours.map((h) => h.value)
  } else {
    // ileride haftalık fonksiyon gelecek
    console.log('Weekly seçeneği henüz eklenmedi')
  }
}

// dropdown değişince yeniden çek
watch(selectedWeeklyOption, updateChart)

// ilk yüklemede de çalıştır
onMounted(updateChart)

async function getdaily() {
  if (!userStore.userId || !selectedTopic.value) {
    return
  }
  const topicId = selectedTopic.value.id
  weeklyTotal.value = await getTodaySessionsByTopic(userStore.userId, topicId)
  console.log('weekly', weeklyTotal)
  console.log('user', userStore.userId, ' : topicid', topicId)
}

const weeklyDropdownItems = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

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
