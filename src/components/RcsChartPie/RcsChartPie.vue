<template>
  <div :id="props.id" class="relative w-full h-full" :class="props.class" :style="props.style">
    <div class="pie-container"><canvas ref="canvas"></canvas></div>
  </div>
</template>

<style src="./RcsChartPie.css"></style>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import type { ChartData } from './RcsChartPie.interface'

Chart.register(...registerables)

const props = defineProps<{
  chartData: ChartData
  id?: string
  class?: string
  style?: string
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

onMounted(() => {
  if (!canvas.value) return

  const createChart = (isDark: boolean) => {
    if (chart) chart.destroy()
    chart = new Chart(canvas.value!, {
      type: 'pie',
      data: props.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: isDark ? '#f3f4f6' : '#111827',
              font: { size: 14 },
            },
          },
        },
      },
    })
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  createChart(media.matches)
  media.addEventListener('change', (e) => createChart(e.matches))
})

watch(
  () => props.chartData,
  (newData) => {
    if (chart) {
      chart.data = newData
      chart.update()
    }
  },
  { deep: true },
)
</script>
