<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h1 class="text-2xl font-semibold mb-6">📊 Chart.js Tüm Grafik Tipleri Testi</h1>

    <!-- Grafik tipi seçici -->
    <div class="mb-6 flex gap-3 items-center">
      <label class="font-medium">Grafik Tipi:</label>
      <select v-model="chartType" @change="createChart" class="border p-2 rounded-lg">
        <option v-for="t in chartTypes" :key="t" :value="t">{{ t }}</option>
      </select>

      <button @click="randomizeData" class="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Verileri Yenile
      </button>
    </div>

    <!-- Grafik alanı -->
    <div class="bg-white rounded-xl shadow p-6 w-full max-w-3xl">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Chart,
  LineController,
  BarController,
  DoughnutController,
  PieController,
  PolarAreaController,
  RadarController,
  LineElement,
  BarElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Chart.js bileşenleri kaydı
Chart.register(
  LineController,
  BarController,
  DoughnutController,
  PieController,
  PolarAreaController,
  RadarController,
  LineElement,
  BarElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
)

// Referanslar
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | undefined

// Tip seçici
const chartTypes = ['line', 'bar', 'pie', 'doughnut', 'polarArea', 'radar'] as const
const chartType = ref<(typeof chartTypes)[number]>('line')

// Örnek veriler
const labels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz']
const data = ref([30, 45, 60, 20, 90, 50, 70])
const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e']

// Rastgele veri üret
function randomizeData() {
  data.value = Array.from({ length: 7 }, () => Math.floor(Math.random() * 100))
  if (chart?.data?.datasets?.[0]) {
    chart.data.datasets[0].data = data.value
    chart.update()
  }
}

// Grafik oluşturucu
function createChart() {
  if (!chartCanvas.value) return
  if (chart) chart.destroy()

  const datasetConfig = {
    label: 'Örnek Veri',
    data: data.value,
    borderColor: '#3b82f6',
    backgroundColor:
      chartType.value === 'pie' || chartType.value === 'doughnut' || chartType.value === 'polarArea'
        ? colors
        : 'rgba(59,130,246,0.4)',
    fill: chartType.value === 'line',
    tension: 0.3,
  }

  chart = new Chart(chartCanvas.value, {
    type: chartType.value,
    data: { labels, datasets: [datasetConfig] },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Chart.js - ${chartType.value.toUpperCase()} Grafiği`,
        },
        legend: { display: true },
      },
      scales:
        chartType.value === 'pie' ||
        chartType.value === 'doughnut' ||
        chartType.value === 'polarArea' ||
        chartType.value === 'radar'
          ? {}
          : {
              y: { beginAtZero: true },
            },
    },
  })
}

// Sayfa yüklenince grafik oluştur
onMounted(() => {
  createChart()
})
</script>

<style scoped>
body {
  font-family: system-ui, sans-serif;
}
</style>
