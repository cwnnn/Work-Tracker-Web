<template>
  <main class="min-h-screen pt-20 px-4 flex flex-col gap-10">
    <!-- ÜST BÖLGE: SOL Chart - SAĞ Dropdown + Pie -->
    <section class="flex flex-col lg:flex-row gap-10">
      <!-- SOL ÜST: Chart -->
      <div class="flex-1 p-4 rounded-2xl">
        <RcsDropdown v-model="selectedWeeklyOption" :items="weeklyDropdownItems" class="mb-4" />
        <RcsChartLine :chartData="chartData" class="h-64 md:h-96" />
      </div>

      <!-- SAĞ ÜST: Topic Seçimi + Pie -->
      <div class="w-full lg:w-80 xl:w-96 flex flex-col items-center gap-6">
        <RcsSearchableDropdown
          v-model="selectedTopic"
          :items="dropdownItems"
          placeholder="Select topic..."
          @create="TopicCreate"
          class="w-full"
          :premium="false"
        />
        <div class="flex gap-6">
          <RcsSoftButton size="lg" class="h-10 w-30" @click="handleShow('Edit')" label="Edit" />

          <RcsSoftButton
            size="lg"
            class="!text-red-700 h-10 w-30"
            @click="handleShow('Delete')"
            label="Delete"
          />
        </div>
      </div>
    </section>

    <!-- ALT BÖLGE: SOL Cards - SAĞ Pie (Sabit Kalsın) -->
    <section class="flex flex-col lg:flex-row gap-10">
      <div class="w-full lg:w-100 lg:pt-8 xl:pt-15 lg:order-2">
        <RcsChartPie :chartData="chartpieData" class="" />
      </div>
      <!-- SOL ALT: Kartlar -->
      <div class="flex-1 flex flex-col gap-12 lg:order-1">
        <!-- This Topic Cards -->
        <div>
          <h2 class="text-xl font-semibold mb-4">This Topic</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <RcsCard
              title="Experience Level"
              :value="currentStats?.levelName! ?? '-'"
              subtitle="This Topic"
              :info="infoExpLvl"
            />
            <RcsCard
              title="Total Focus (This Topic)"
              :value="MsToHour(currentStats?.totalMs!) ?? '-'"
              subtitle="Hours"
            />
            <RcsCard
              title="Session Count"
              :value="currentStats?.sessionCount! ?? '-'"
              subtitle="Total"
            />
            <RcsCard
              title="Last Session"
              :value="formatLastSession(currentStats?.lastSessionAt)"
              subtitle="Day"
            />
          </div>
        </div>

        <!-- All Topics Cards -->
        <div>
          <h2 class="text-xl font-semibold mb-4 text-yellow-500">All Topics</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <RcsCard
              title="Focus Streak"
              :value="streak ?? '-'"
              subtitle="Days"
              :alarm="streakAlarm"
            />
            <RcsCard
              title="Peak Focus Session"
              :value="MsToHour(currentAlStats.peakFocusSession!)"
              subtitle="Local Time"
              premium
            />
            <RcsCard
              title="Total Focus (All Topics)"
              :value="MsToHour(currentAlStats.totalFocusMs!)"
              subtitle="Hours"
              premium
            />
            <RcsCard
              title="Avg. Daily Focus"
              :value="MsToHour(currentAlStats.avgDailyFocusMs!)"
              subtitle="Hours"
              premium
            />
          </div>
        </div>
      </div>
    </section>

    <RcsTopicModal
      :visible="showModal"
      :mode="modalMode"
      :title="modalTitle"
      :message="modalMessage"
      :topicName="selectedTopic?.label!"
      @close="showModal = false"
      @confirmed="DeleteOrEdit"
    />
    <RcsLoading :visible="loading" :status="loadingStatus" :text="loadingText" />
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

import RcsSearchableDropdown from '../components/RcsSoftSearchableDropdown/RcsSearchableDropdown.vue'
import RcsChartLine from '../components/RcsChartLine/RcsChartLine.vue'
import RcsDropdown from '../components/RcsDropdown/RcsDropdown.vue'
import RcsChartPie from '../components/RcsChartPie/RcsChartPie.vue'
import RcsCard from '../components/RcsCard/RcsCard.vue'
import RcsTopicModal from '@/components/RcsTopicModal/RcsTopicModal.vue'

import { useTopicStore } from '@/stores/topicStore'
import { useUserStore } from '@/stores/userStore'
import { useTopicStatsStore } from '@/stores/topicStatsStore'
import { useAllTopicStatsStore } from '@/stores/AllTopicStatsStore'

import { saveGlobalErrorLog, getStatsAllTopics } from '@/utils/firebaseUtils/firebaseUtils'
import { createTopic } from '../utils/firebaseUtils/SaveSessions'
import { getAllTopicsWithTotalHours } from '@/utils/firebaseUtilsPieChard'
import { toTitleCase } from '@/utils/TitleCorrUtils'
import {
  updateAvgDailyFocus,
  updateFocusStreak,
} from '../utils/firebaseUtilsCard/firebaseUtilsCard'
const streak = ref<string | null>(null)
let streakAlarm = false

const allStats = useAllTopicStatsStore()
const infoExpLvl = `
🏆 **Experience Levels**

• Beginner – 0 hours
• Novice – 10 hours
• Learner – 30 hours
• Intermediate – 70 hours
• Skilled – 120 hours
• Advanced – 200 hours
• Proficient – 350 hours
• Expert – 500 hours
• Master – 700 hours
• Grandmaster – 900 hours
• Mythic – 1200 hours
• Transcendent – 2000 hours
• Celestial – 5000 hours
• Omniscient – 10000 hours
`

onMounted(async () => {
  updateAvgDailyFocus(userStore.userId!)
  getStatsAllTopics(userStore.userId!)
  const result = await updateFocusStreak(userStore.userId!)
  if (!result.streak) return (streak.value = result)
  streak.value = result.streak
  streakAlarm = result.alarm
  console.log('result', result, 'streak.value', streak.value, 'updated:', result.error)
})

import {
  getDailyStats,
  getMonthlyStats,
  getWeeklyStats,
  getYearlyStats,
} from '@/utils/firebaseUtils/AggregationUtils'
import RcsSoftButton from '@/components/RcsSoftButton/RcsSoftButton.vue'
import { deleteTopic } from '@/utils/firebaseUtils/deleteTopicUtils'
import { updateTopicName } from '@/utils/firebaseUtils/editTopicUtils'
import RcsLoading from '@/components/RcsLoading/RcsLoading.vue'

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

function formatLastSession(lastSessionAt?: Date | null): string {
  if (!lastSessionAt) return '-'

  const now = new Date()
  // Her iki tarihi de gün başlangıcına (00:00) sabitle
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const last = new Date(
    lastSessionAt.getFullYear(),
    lastSessionAt.getMonth(),
    lastSessionAt.getDate(),
  )

  const diffMs = today.getTime() - last.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'In the future 🤔'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

const currentStats = computed(() => {
  if (!selectedTopic.value) return null
  return topicStatsStore.getStats(selectedTopic.value.id)
})
const currentAlStats = computed(() => {
  return allStats.getStats()
})
function MsToHour(totalMs: number) {
  if (totalMs == null) return 0
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
  { label: 'Yearly', value: 'yearly', premium: true },
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
    // 🔹 Günlük veriyi çek
    const daily = await getDailyStats(userId, topicId)
    console.log('daily', daily)

    chartData.value.labels = (daily.labels ?? []).map((l) => `${l}:00`) // örn: "00:00", "01:00"
    chartData.value.datasets[0]!.data = daily.data
    chartData.value.datasets[0]!.label = 'minutes'
    chartData.value.datasets[0]!.borderColor = 'MediumPurple'
  } else if (selectedWeeklyOption.value === 'weekly') {
    const weekly = await getWeeklyStats(userId, topicId)
    console.log('weekly', weekly)

    chartData.value.labels = (weekly.labels ?? []).map((l) => l ?? '')
    chartData.value.datasets[0]!.data = weekly.data
    chartData.value.datasets[0]!.label = 'Hours'
    chartData.value.datasets[0]!.borderColor = 'MediumPurple'
  } else if (selectedWeeklyOption.value === 'monthly') {
    const monthly = await getMonthlyStats(userId, topicId)
    console.log('monthly', monthly)

    chartData.value.labels = monthly.labels
    chartData.value.datasets[0]!.data = monthly.data
    chartData.value.datasets[0]!.label = 'Hours'
    chartData.value.datasets[0]!.borderColor = 'MediumPurple'
  } else if (selectedWeeklyOption.value === 'yearly') {
    const yearly = await getYearlyStats(userId, topicId)
    console.log('yearly', yearly)

    chartData.value.labels = yearly.labels
    chartData.value.datasets[0]!.data = yearly.data
    chartData.value.datasets[0]!.label = 'Hours'
    chartData.value.datasets[0]!.borderColor = '#eab308'
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

async function TopicCreate(label: string) {
  try {
    const userId = userStore.userId
    if (!userId) {
      console.error('User ID bulunamadı!')
      return
    }

    if (topicStore.topics.length >= 3) {
      alert('Since we are in Beta, you can create up to 3 topics.\nPlease delete an existing one.')
      return
    }

    const topicName = toTitleCase(label)
    const topic = await createTopic(userId, topicName)

    const newTopic = { id: topic.topicId, topic: topicName }
    topicStore.addTopic(newTopic)

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
const showModal = ref(false)
const modalTitle = ref(' ')
const modalMessage = ref(' ')
const modalMode = ref<'edit' | 'delete'>('edit')

async function handleShow(title: string) {
  if (title == 'Delete') {
    showModal.value = true
    modalMode.value = 'delete'
    modalTitle.value = 'Delete Topic'
    modalMessage.value = `Type the topic name Backend Study to confirm deletion."${selectedTopic.value?.label}"`
  } else if (title == 'Edit') {
    showModal.value = true
    modalMode.value = 'edit'
    modalTitle.value = 'Edit Topic'
    modalMessage.value = `New topic name:`
  }
}
const loading = ref(false)
const loadingStatus = ref<'loading' | 'success' | 'error'>('loading')
const loadingText = ref('Processing...')

async function DeleteOrEdit(newName: string) {
  console.log('newName', newName)
  const topicId = selectedTopic.value!.id

  showModal.value = false
  loading.value = true
  loadingStatus.value = 'loading'
  loadingText.value = modalMode.value === 'delete' ? 'Deleting topic...' : 'Updating topic...'

  try {
    if (modalMode.value === 'delete') {
      await deleteTopic(userStore.userId!, topicId)
      topicStore.removeTopic(topicId)
      selectedTopic.value = null
    } else {
      await updateTopicName(userStore.userId!, topicId, newName)
      topicStore.updateTopicName(topicId, newName)
      selectedTopic.value!.label = newName
    }

    // ✅ Başarılı
    loadingStatus.value = 'success'
    loadingText.value = 'Success!'
  } catch (err) {
    console.error('DeleteOrEdit hata:', err)
    // ❌ Hata
    loadingStatus.value = 'error'
    loadingText.value = 'Something went wrong.'
  } finally {
    // ⏳ Biraz bekle ve overlay’i kapat
    setTimeout(() => {
      loading.value = false
    }, 1200)
  }
}
</script>
