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
  chart = new Chart(canvas.value, {
    type: 'line',
    data: props.chartData,
    options: { responsive: true, maintainAspectRatio: false },
  })
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
