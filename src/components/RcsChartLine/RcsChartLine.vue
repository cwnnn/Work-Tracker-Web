<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import type { ChartData } from './RcsChartLine.interface'
import type { BaseProps } from '../BaseProps'

Chart.register(...registerables)

type ChartProps = {
  chartData: ChartData
} & BaseProps

const props = defineProps<ChartProps>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

onMounted(() => {
  if (!canvas.value) return

  const createChart = (isDark: boolean) => {
    if (chart) chart.destroy()

    chart = new Chart(canvas.value!, {
      type: 'line',
      data: props.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: isDark ? '#f3f4f6' : '#111827' },
            grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
          },
          y: {
            ticks: { color: isDark ? '#f3f4f6' : '#111827' },
            grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
          },
        },
        plugins: {
          legend: {
            labels: { color: isDark ? '#f3f4f6' : '#111827' },
          },
        },
      },
    })
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  createChart(media.matches)

  // tema değişirse canlı güncelle
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
<style src="./RcsChartLine.css"></style>

<template>
  <div :id="props.id" :class="props.class" :style="props.style">
    <div class="rcs-panel">
      <canvas ref="canvas"></canvas>
    </div>
  </div>
</template>
