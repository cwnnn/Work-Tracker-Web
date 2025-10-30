<template>
  <div class="p-6 bg-gray-50 min-h-screen grid grid-cols-2 gap-6">
    <!-- Sol Üst: Line Chart + Zaman Filtresi -->
    <div class="flex flex-col gap-3">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold">Çalışma Süresi</h2>
        <select v-model="timeRange" class="border rounded-lg p-1 bg-white">
          <option value="hourly">Saatlik</option>
          <option value="daily">Günlük</option>
          <option value="weekly">Haftalık</option>
          <option value="monthly">Aylık</option>
        </select>
      </div>
      <canvas ref="lineCanvas" class="bg-white p-4 rounded-xl shadow"></canvas>
    </div>

    <!-- Sağ Üst: Ders Seçimi + Pie Chart -->
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <RcsSoftSearchableDropdown
          :options="topics"
          v-model="selectedTopic"
          placeholder="Ders seçin"
        />
      </div>
      <canvas ref="pieCanvas" class="bg-white p-4 rounded-xl shadow"></canvas>
    </div>

    <!-- Alt Kartlar -->
    <div class="col-span-2 grid grid-cols-4 gap-4 mt-6">
      <div
        v-for="card in statCards"
        :key="card.title"
        class="bg-white p-4 rounded-xl shadow text-center"
      >
        <h3 class="text-sm text-gray-500">{{ card.title }}</h3>
        <p class="text-2xl font-semibold mt-1">{{ card.value }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import RcsSoftSearchableDropdown from '@/components/RcsSoftSearchableDropdown/RcsSearchableDropdown.vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  PieController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Chart.js setup
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  PieController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
)

// refs
const lineCanvas = ref<HTMLCanvasElement | null>(null)
const pieCanvas = ref<HTMLCanvasElement | null>(null)
let lineChart: Chart | undefined
let pieChart: Chart | undefined

// state
const timeRange = ref<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily')
const selectedTopic = ref('Matematik')
const topics = ['Matematik', 'Fizik', 'İngilizce', 'Kimya']

// sahte veri
const labels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz']
const durations = ref([3, 4, 2, 5, 6, 1, 0]) // saat
const pieLabels = ['Matematik', 'Fizik', 'İngilizce', 'Kimya']
const pieData = ref([12, 8, 6, 4])

// kartlar
const totalHours = ref(30)
const avgDaily = ref(4.2)
const mostActiveDay = ref('Perşembe — 6.1 saat')
const experienceLevel = ref(getExperienceLevel(totalHours.value))

const statCards = [
  { title: 'Toplam Süre', value: `${totalHours.value} saat` },
  { title: 'Deneyim', value: experienceLevel.value },
  { title: 'Günlük Ortalama', value: `${avgDaily.value} saat` },
  { title: 'En Aktif Gün', value: mostActiveDay.value },
]

// deneyim seviyesi hesaplama
function getExperienceLevel(hours: number) {
  if (hours < 1000) return 'Acemi'
  if (hours < 3000) return 'Gelişen'
  if (hours < 7000) return 'Usta'
  return 'Master'
}

// chart çizimleri
onMounted(() => {
  if (!lineCanvas.value || !pieCanvas.value) return

  // line chart
  lineChart = new Chart(lineCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Günlük Süre (saat)',
          data: durations.value,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.2)',
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Seçilen Derste Çalışma Süresi' },
        legend: { display: false },
      },
      scales: { y: { beginAtZero: true } },
    },
  })

  // pie chart
  pieChart = new Chart(pieCanvas.value, {
    type: 'pie',
    data: {
      labels: pieLabels,
      datasets: [
        {
          data: pieData.value,
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Tüm Derslerin Dağılımı' },
        legend: { position: 'bottom' },
      },
    },
  })
})

// grafik güncelleme
watch(selectedTopic, (_topic) => {
  // sahte değişim efekti
  durations.value = Array.from({ length: 7 }, () => Math.floor(Math.random() * 6))
  if (lineChart?.data.datasets[0]) {
    lineChart.data.datasets[0].data = durations.value
    lineChart.update()
  }
})

watch(pieData, (newData) => {
  if (pieChart?.data.datasets[0]) {
    pieChart.data.datasets[0].data = newData
    pieChart.update()
  }
})
</script>

<style scoped>
body {
  font-family: system-ui, sans-serif;
}
</style>
