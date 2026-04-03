<template>
  <div class="donut-chart-wrapper">
    <div v-if="config.title" class="chart-header">
      <h3 class="chart-title">{{ config.title }}</h3>
      <p v-if="config.subtitle" class="chart-subtitle">{{ config.subtitle }}</p>
    </div>
    <v-chart 
      v-if="chartOption && chartOption.series"
      :option="chartOption" 
      @click="handleClick"
      class="chart"
      autoresize
    />
    <div v-else class="empty-state">
      <p>No data to display</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  PieChart,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

const props = defineProps({
  config: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const chartOption = computed(() => {
  if (!props.config?.data?.length) return null
  
  const { config } = props
  const chartData = config.data.map(item => ({
    name: item[config.categoryColumn],
    value: item[config.valueColumn]
  }))

  // Calculate total
  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return {
    title: {
      show: false // We'll use custom header instead
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      confine: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'transparent',
      textStyle: {
        color: 'white',
        fontSize: 12
      }
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 'right',
      top: 'middle',
      align: 'left',
      textStyle: {
        fontSize: 12,
        color: '#374151',
        fontWeight: 'normal'
      },
      formatter: (name) => {
        const item = chartData.find(d => d.name === name)
        const percentage = item ? ((item.value / total) * 100).toFixed(1) : 0
        return `${name.length > 20 ? name.substring(0, 18) + '...' : name}  (${percentage}%)`
      },
      itemWidth: 14,
      itemHeight: 14,
      borderRadius: 7,
      pageIconColor: '#6b7280',
      pageIconInactiveColor: '#d1d5db',
      pageIconSize: 12,
      pageTextStyle: {
        color: '#374151',
        fontSize: 10
      },
      animation: true
    },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['40%', '55%'],
      avoidLabelOverlap: true,
      data: chartData,
      label: {
        show: true,
        formatter: '{d}%',
        position: 'outside',
        fontSize: 11,
        fontWeight: 'normal',
        color: '#374151',
        lineHeight: 16
      },
      labelLine: {
        length: 8,
        length2: 6,
        smooth: true
      },
      emphasis: {
        scale: true,
        scaleSize: 8,
        label: {
          show: true,
          fontWeight: 'bold',
          fontSize: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: [2, 4, 2, 4],
          borderRadius: 4
        }
      },
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2,
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.1)'
      },
      animation: true,
      animationDuration: 700,
      animationEasing: 'cubicOut'
    }],
    backgroundColor: 'transparent'
  }
})

function handleClick(params) {
  if (params?.name) {
    emit('click', {
      name: params.name,
      value: params.value,
      percent: params.percent
    })
  }
}
</script>

<style scoped>
.donut-chart-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: white;
  border-radius: 0.5rem;
  padding: 0.5rem;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chart-header {
  padding: 0.75rem 1rem 0.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 0.5rem;
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.4;
}

.chart-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
  line-height: 1.3;
}

.chart {
  width: 100%;
  flex: 1;
  min-height: 320px;
}

/* Ensure legend doesn't get cut off */
.chart :deep(.echarts) {
  overflow: visible !important;
}

/* Legend styling */
.chart :deep(.echarts-legend) {
  overflow-y: auto !important;
  max-height: 80% !important;
  padding: 8px 4px !important;
  scrollbar-width: thin;
}

/* Custom scrollbar for legend */
.chart :deep(.echarts-legend::-webkit-scrollbar) {
  width: 4px;
}

.chart :deep(.echarts-legend::-webkit-scrollbar-track) {
  background: #f1f1f1;
  border-radius: 2px;
}

.chart :deep(.echarts-legend::-webkit-scrollbar-thumb) {
  background: #c1c1c1;
  border-radius: 2px;
}

.chart :deep(.echarts-legend::-webkit-scrollbar-thumb:hover) {
  background: #a1a1a1;
}

/* Legend items spacing */
.chart :deep(.echarts-legend-item) {
  margin-bottom: 8px !important;
  padding: 2px 4px !important;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.chart :deep(.echarts-legend-item:hover) {
  background-color: #f3f4f6 !important;
  cursor: pointer;
}

/* Tooltip styling */
:deep(.echarts-tooltip) {
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  padding: 8px 12px !important;
  font-size: 12px !important;
  line-height: 1.4 !important;
}

/* Make chart responsive */
@media (max-width: 768px) {
  .donut-chart-wrapper {
    min-height: 350px;
    padding: 0.25rem;
  }
  
  .chart-header {
    padding: 0.5rem 0.75rem 0.25rem 0.75rem;
  }
  
  .chart-title {
    font-size: 0.875rem;
  }
  
  .chart-subtitle {
    font-size: 0.7rem;
  }
  
  .chart :deep(.echarts-legend-item) {
    margin-bottom: 4px !important;
  }
  
  .chart :deep(.echarts-legend) {
    font-size: 10px !important;
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 320px;
  color: #9ca3af;
  background: #f9fafb;
  border-radius: 0.5rem;
  font-size: 14px;
}
</style>