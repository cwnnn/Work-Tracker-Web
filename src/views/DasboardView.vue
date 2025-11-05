<template>
  <main class="max-h-screen p-2 pt-20 grid gap-4 grid-cols-1 md:grid-cols-[5fr_2fr] md:grid-rows-2">
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

    <section class="p-4 flex flex-col items-center md:pt-10 md:order-4">
      <RcsChartPie :chartData="chartpieData" />
    </section>

    <section class="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:order-3">
      <RcsCard title="Experience Level" :value="currentStats?.levelName!" subtitle="This Topic" />
      <RcsCard
        title="Total Focus (This Topic)"
        :value="MsToHour(currentStats?.totalMs!)"
        subtitle="Hours"
      />
      <RcsCard title="Avg. Daily Focus" value=" 0" subtitle="Hours" />
      <RcsCard title="Today’s Focus" value="0" subtitle="Hours" />

      <!-- SPACER -->

      <RcsCard title="Focus Streak" value="0" subtitle="Days" />
      <RcsCard title="Peak Focus Hour" value="0" subtitle="Local Time" />
      <RcsCard title="Total Focus (All Topics)" value="0" subtitle="Hours" />
      <RcsCard title="Avg. Daily Focus" value="0" subtitle="Hours" />
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
import { useTopicStatsStore } from '@/stores/topicStatsStore'

import { saveGlobalErrorLog } from '@/utils/firebaseUtils'
import { createTopic } from '../utils/firebaseUtils/SaveSessions'
import { getAllTopicsWithTotalHours } from '@/utils/firebaseUtilsPieChard'
import { toTitleCase } from '@/utils/TitleCorrUtils'

import {
  getMonthlySessionsByTopic,
  getTodaySessionsByTopic,
  getWeeklySessionsByTopic,
  getYearlySessionsByTopic,
} from '@/utils/firebaseUtilsLineChard'

const topicStore = useTopicStore()
const userStore = useUserStore()
const topicStatsStore = useTopicStatsStore()
const selectedTopic = ref<{ id: string; label: string } | null>(null)

const dropdownItems = computed(() =>
  topicStore.topics.map((t) => ({
    id: t.id,
    label: t.topic,
  })),
)

const currentStats = computed(() => {
  if (!selectedTopic.value) return null
  return topicStatsStore.getStats(selectedTopic.value.id)
})
function MsToHour(totalMs: number) {
  const totalMinutes = Math.floor(totalMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours}:${minutes.toString().padStart(2, '0')}`
}

const selectedWeeklyOption = ref('daily')

const weeklyDropdownItems = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

const chartData = ref({
  labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
  datasets: [
    {
      borderColor: 'MediumPurple',
      label: 'minutes',
      data: Array(24).fill(0),
      borderWidth: 2,
      tension: 0.3,
    },
  ],
})

// chart'ı güncelleyen fonksiyon
async function updateChart() {
  const userId = userStore.userId
  const topicId = selectedTopic.value?.id
  if (!userId || !topicId) return console.warn('Kullanıcı veya topic eksik.')

  if (selectedWeeklyOption.value === 'daily') {
    const hours = await getTodaySessionsByTopic(userId, topicId)
    chartData.value.labels = hours.map((h) => `${h.id}:00`)
    chartData.value.datasets[0]!.data = hours.map((h) => h.value)
    chartData.value.datasets[0]!.label = 'Minutes'
  } else if (selectedWeeklyOption.value === 'weekly') {
    const weekly = await getWeeklySessionsByTopic(userId, topicId)
    chartData.value.labels = (weekly.labels ?? []).map((l) => l ?? '')
    chartData.value.datasets[0]!.data = weekly.data
    chartData.value.datasets[0]!.label = 'Hours'
  } else if (selectedWeeklyOption.value === 'monthly') {
    const monthly = await getMonthlySessionsByTopic(userId, topicId)
    chartData.value.labels = (monthly.labels ?? []).map((l) => l ?? '')
    chartData.value.datasets[0]!.data = monthly.data
    chartData.value.datasets[0]!.label = 'Hours'
  } else if (selectedWeeklyOption.value === 'yearly') {
    const yearly = await getYearlySessionsByTopic(userId, topicId)
    chartData.value.labels = (yearly.labels ?? []).map((l) => l ?? '')
    chartData.value.datasets[0]!.data = yearly.data
    chartData.value.datasets[0]!.label = 'Hours'
  }
}

//dropdown değişince yeniden çek
onMounted(() => {
  updateChart() //ilk grafiği yükle
})

//topic listesi yüklendiğinde ilkini öğeyi seç
watch(
  dropdownItems,
  (items) => {
    if (items.length > 1 && !selectedTopic.value) {
      selectedTopic.value = items[0] || null
    }
  },
  { immediate: true }, // eğer liste hazırsa hemen çalışır
)

//topic veya weekly option değiştiğinde grafik güncelle
watch([selectedTopic, selectedWeeklyOption], updateChart)

const chartpieData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: 'Total Hours',
      backgroundColor: [
        '#FF6384', // kırmızımsı pembe
        '#36A2EB', // mavi
        '#FFCE56', // sarı
        '#4BC0C0', // turkuaz
        '#9966FF', // mor
        '#FF9F40', // turuncu
        '#C9CBCF', // gri
        '#8BC34A', // yeşil
        '#F44336', // kırmızı
        '#00BCD4', // cam göbeği
        '#E91E63', // fuşya
        '#9C27B0', // menekşe
        '#3F51B5', // lacivert
        '#03A9F4', // açık mavi
        '#009688', // koyu turkuaz
        '#CDDC39', // lime yeşili
        '#FFEB3B', // parlak sarı
        '#FFC107', // kehribar
        '#FF5722', // koyu turuncu
        '#795548', // kahverengi
      ],
      data: [] as number[],
      borderWidth: 1,
    },
  ],
})

async function loadPieChart() {
  const userId = userStore.userId
  if (!userId) return console.warn('Kullanıcı eksik.')

  const { labels, data } = await getAllTopicsWithTotalHours(userId)

  chartpieData.value.labels = labels
  chartpieData.value.datasets[0]!.data = data
  chartpieData.value.datasets[0]!.label = 'Total Hours'
}

watch(
  () => userStore.userId,
  () => loadPieChart(),
  { immediate: true },
)

//Yeni topic oluşturma fonksiyonu
async function TopicCreate(label: string) {
  try {
    const userId = userStore.userId
    if (!userId) {
      console.error('User ID bulunamadı!')
      return
    }

    const topicName = toTitleCase(label)
    const topic = await createTopic(userId, topicName)

    // store’a ekle
    const newTopic = { id: topic.topicId, topic: topicName }
    topicStore.addTopic(newTopic)

    // seçili topic olarak ata
    selectedTopic.value = { id: newTopic.id, label: newTopic.topic }

    console.log(`Yeni topic oluşturuldu: ${topicName}`)
  } catch (error: unknown) {
    const e = error instanceof Error ? error : new Error(String(error))
    console.error('Topic oluşturulamadı:', e)
    await saveGlobalErrorLog(e.message, 'TopicCreate', userStore.userId ?? undefined, e.stack, {
      label,
    })
  }
}
</script>
