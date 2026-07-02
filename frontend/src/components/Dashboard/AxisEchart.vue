

<template>
  <div class="h-full w-full" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])
const chartRef = ref(null)
let chartInstance = null
let echartsLib = null

async function getEcharts() {
  if (echartsLib) return echartsLib
  const module = await import('echarts')
  echartsLib = module.default ?? module
  return echartsLib
}

// function convertToEChartsConfig(config) {
//   if (!config || !config.data) return {}
  
//   // Extract x-axis categories
//   const categories = config.data.map(item => item[config.xAxis.key])
//   const categoryCount = categories.length
  
//   // Dynamic bar width based on data count
//   let barWidth = '60%'
//   if (categoryCount <= 5) {
//     barWidth = '50%'
//   } else if (categoryCount <= 8) {
//     barWidth = '55%'
//   } else if (categoryCount <= 12) {
//     barWidth = '45%'
//   } else {
//     barWidth = '35%'
//   }
  
//   // Dynamic label rotation and spacing based on category count
//   let labelRotate = 0
//   let bottomMargin = '8%'
//   let axisLabelMargin = 12
  
//   if (categoryCount > 10) {
//     labelRotate = 45
//     bottomMargin = '12%'
//     axisLabelMargin = 18
//   } else if (categoryCount > 6) {
//     labelRotate = 35
//     bottomMargin = '10%'
//     axisLabelMargin = 15
//   }
  
//   // Adjust top margin based on content to prevent overlap
//   const hasTitle = config.title && config.title !== ''
//   const hasSubtitle = config.subtitle && config.subtitle !== ''
//   const hasLegend = config.series && config.series.length > 0
  
//   // Compute numeric pixel offsets (numbers chosen to match common chart header heights)
//   const titleTop = hasTitle ? 12 : 6        // px from top for the title
//   const titleHeight = hasTitle ? 22 : 0     // estimated title block height
//   const subtitleHeight = hasSubtitle ? 16 : 0
//   const legendTop = hasLegend ? (titleTop + titleHeight + subtitleHeight + 8) : (titleTop + titleHeight)
//   const gridTop = legendTop + (hasLegend ? 36 : 18)
  
//   const series = config.series.map(series => ({
//     name: series.name,
//     type: series.type,
//     data: config.data.map(item => item[series.name]),
//     yAxisIndex: series.axis === 'y2' ? 1 : 0,
//     barWidth: barWidth,
//     itemStyle: {
//       borderRadius: [4, 4, 0, 0]
//     },
//     label: {
//       show: series.type === 'line',
//       position: 'top',
//       fontSize: 11
//     }
//   }))
  
//   return {
//     title: {
//       show: true,
//       text: config.title || '',
//       subtext: config.subtitle || '',
//       left: 'left',
//       top: titleTop,
//       textStyle: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#1f2937',
//         fontFamily: 'Inter, system-ui, sans-serif'
//       },
//       subtextStyle: {
//         fontSize: 12,
//         color: '#6b7280',
//         fontFamily: 'Inter, system-ui, sans-serif'
//       },
//       itemGap: 8
//     },
//     tooltip: {
//       trigger: 'axis',
//       axisPointer: { type: 'shadow' },
//       backgroundColor: 'rgba(255, 255, 255, 0.95)',
//       borderColor: '#e5e7eb',
//       borderWidth: 1,
//       textStyle: {
//         fontSize: 12,
//         color: '#374151'
//       }
//     },
//       legend: {
//       data: config.series.map(s => s.name),
//       orient: 'horizontal',
//       left: 'left',
//       top: legendTop,
//       itemWidth: 25,
//       itemHeight: 14,
//       textStyle: {
//         fontSize: 12,
//         color: '#4b5563'
//       },
//       // show series.label (fallback to series.name), remove underscores and capitalize first letter
//       formatter: function(name) {
//         const s = (config.series || []).find(ss => ss.name === name) || {}
//         const raw = s.label || name || ''
//         // remove underscores and collapse multiple spaces, then trim
//         const cleaned = String(raw).replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
//         return cleaned.length ? (cleaned.charAt(0).toUpperCase() + cleaned.slice(1)) : ''
//       },
//       lineStyle: {
//         width: 2
//       }
//     },   grid: {
//       left: '8%',
//       right: '8%',
//       bottom: bottomMargin,
//       top: gridTop,
//       containLabel: true,
//       borderWidth: 0,
//       backgroundColor: 'transparent'
//     },
//     xAxis: {
//       type: 'category',
//       data: categories,
//       name: config.xAxis?.title || '',
//       nameLocation: 'middle',
//       nameGap: categoryCount > 10 ? 70 : categoryCount > 6 ? 60 : 50,
//       nameTextStyle: {
//         fontSize: 12,
//         fontWeight: '500',
//         color: '#6b7280'
//       },
//       axisLabel: {
//         rotate: labelRotate,
//         interval: 0,
//         fontSize: 11,
//         color: '#6b7280',
//         margin: axisLabelMargin,
//         // Truncate long labels to prevent overlap; coerce non-strings
//         formatter: function(value) {
//           if (value == null) return ''
//           const str = String(value)
//           if (str.length > 15) {
//             return str.substring(0, 12) + '...'
//           }
//           return str
//         },
//         // ensure overflowing labels show ellipsis in tooltip when hovered
//         overflow: 'truncate'
//       },
//       axisLine: {
//         lineStyle: {
//           color: '#e5e7eb',
//           width: 1
//         }
//       },
//       axisTick: {
//         show: false
//       }
//     },
//     yAxis: [
//       {
//         type: 'value',
//         name: config.yAxis?.title || '',
//         nameLocation: 'middle',
//         nameGap: 45,
//         nameTextStyle: {
//           fontSize: 12,
//           fontWeight: '500',
//           color: '#6b7280'
//         },
//         splitLine: {
//           lineStyle: {
//             color: '#f3f4f6',
//             width: 1,
//             type: 'dashed'
//           }
//         },
//         axisLabel: {
//           fontSize: 11,
//           color: '#6b7280'
//         },
//         axisLine: {
//           show: false
//         },
//         axisTick: {
//           show: false
//         }
//       },
//       {
//         type: 'value',
//         name: config.y2Axis?.title || '',
//         nameLocation: 'middle',
//         nameGap: 45,
//         nameTextStyle: {
//           fontSize: 12,
//           fontWeight: '500',
//           color: '#6b7280'
//         },
//         splitLine: {
//           show: false
//         },
//         axisLabel: {
//           fontSize: 11,
//           color: '#6b7280'
//         },
//         axisLine: {
//           show: false
//         },
//         axisTick: {
//           show: false
//         }
//       }
//     ],
//     series: series
//   }
// }







function convertToEChartsConfig(config) {
  if (!config || !config.data) return {}
  
  // Check if this is the Sales Trend chart
  const isSalesTrend = config.title === 'Sales trend' || 
                       (config.title && config.title.toLowerCase().includes('sales trend'))
  
  // Extract x-axis categories
  const categories = config.data.map(item => item[config.xAxis.key])
  const categoryCount = categories.length
  
  // ============ DEFAULT SETTINGS (for all other charts) ============
  let barWidth = '60%'
  if (categoryCount <= 5) {
    barWidth = '50%'
  } else if (categoryCount <= 8) {
    barWidth = '55%'
  } else if (categoryCount <= 12) {
    barWidth = '45%'
  } else {
    barWidth = '35%'
  }
  
  let labelRotate = 0
  let bottomMargin = '8%'
  let axisLabelMargin = 12
  let labelFontSize = 11
  let labelInterval = 0
  // x-axis name placement defaults (can be adjusted for bar charts)
  let xAxisNameLocation = 'middle'
  let xAxisNameGap = 32
  
  // Default interval calculation
  const explicitInterval = typeof config.xAxis?.interval !== 'undefined' 
    ? config.xAxis.interval 
    : (typeof config.xAxis?.labelInterval !== 'undefined' ? config.xAxis.labelInterval : null)
  
  if (explicitInterval !== null) {
    labelInterval = explicitInterval
  } else {
    const maxVisible = 12
    if (categoryCount <= maxVisible) {
      labelInterval = 0
    } else {
      labelInterval = Math.ceil(categoryCount / maxVisible) - 1
    }
  }
  
  // ============ ORIGINAL ROTATION AND SPACING LOGIC (PRESERVED) ============
  if (categoryCount > 10) {
    labelRotate = 45
    bottomMargin = '12%'
    axisLabelMargin = 18
  } else if (categoryCount > 6) {
    labelRotate = 35
    bottomMargin = '10%'
    axisLabelMargin = 15
  }

  // If the chart contains bar series, provide extra bottom spacing so
  // the labels and axis title don't overlap the bars or get clipped.
  const hasBarSeries = (config.series || []).some(s => s.type === 'bar')
  if (hasBarSeries) {
    const currentBottom = parseInt(String(bottomMargin).replace('%', '')) || 8
    // add more space for bar charts where labels commonly collide
    bottomMargin = `${Math.max(currentBottom, 8) + 6}%`
    axisLabelMargin = axisLabelMargin + 8
    // move axis name below labels for clarity and increase gap
    xAxisNameLocation = 'bottom'
    xAxisNameGap = 60
  }
  
  // ============ SALES TREND SPECIFIC OPTIMIZATIONS ============
  if (isSalesTrend) {
    if (categoryCount <= 30) {
      labelInterval = 0
      labelRotate = 0
      bottomMargin = '8%'
      labelFontSize = 11
    } 
    else if (categoryCount <= 60) {
      labelInterval = 2
      labelRotate = 35
      bottomMargin = '12%'
      axisLabelMargin = 18
      labelFontSize = 10
    } 
    else if (categoryCount <= 90) {
      labelInterval = 4
      labelRotate = 45
      bottomMargin = '15%'
      axisLabelMargin = 20
      labelFontSize = 9
    } 
    else if (categoryCount <= 180) {
      labelInterval = 9
      labelRotate = 45
      bottomMargin = '15%'
      axisLabelMargin = 22
      labelFontSize = 9
    } 
    else {
      labelInterval = 13
      labelRotate = 45
      bottomMargin = '18%'
      axisLabelMargin = 25
      labelFontSize = 8
    }
    
    if (categoryCount > 30) {
      barWidth = '25%'
    } else if (categoryCount > 15) {
      barWidth = '35%'
    }
  }
  
  // ============ X-AXIS LABEL FORMATTER ============
  const labelFormatter = function(value, index) {
    if (value == null) return ''
    const str = String(value)
    
    // If an interval is set, only show labels at the correct indices
    if (typeof labelInterval === 'number' && labelInterval > 0) {
      const step = labelInterval + 1
      if ((index % step) !== 0) return ''
    }

    if (isSalesTrend && categoryCount > 30) {
      let formatted = str
      const dateMatch = str.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
      if (dateMatch) {
        // format as MM/DD (remove leading zeros)
        const mm = String(Number(dateMatch[2]))
        const dd = String(Number(dateMatch[3]))
        formatted = `${mm}/${dd}`
      }
      if (formatted.length > 6) {
        return formatted.substring(0, 5)
      }
      return formatted
    }
    
    if (str.length > 15) {
      return str.substring(0, 12) + '...'
    }
    return str
  }
  
  // Adjust top margin based on content
  const hasTitle = config.title && config.title !== ''
  const hasSubtitle = config.subtitle && config.subtitle !== ''
  const hasLegend = config.series && config.series.length > 0
  
  const titleTop = hasTitle ? 12 : 6
  const titleHeight = hasTitle ? 22 : 0
  const subtitleHeight = hasSubtitle ? 16 : 0
  const legendTop = hasLegend ? (titleTop + titleHeight + subtitleHeight + 8) : (titleTop + titleHeight)
  const gridTop = legendTop + (hasLegend ? 36 : 18)
  
  // ============ SERIES CONFIGURATION ============
  const series = config.series.map(seriesItem => ({
    name: seriesItem.name,
    type: seriesItem.type,
    data: config.data.map(item => item[seriesItem.name]),
    yAxisIndex: seriesItem.axis === 'y2' ? 1 : 0,
    barWidth: seriesItem.type === 'bar' ? barWidth : undefined,
    itemStyle: seriesItem.type === 'bar' ? {
      borderRadius: [4, 4, 0, 0]
    } : undefined,
    label: {
      show: seriesItem.type === 'line' && categoryCount <= 20,
      position: 'top',
      fontSize: 10
    },
    ...(isSalesTrend && seriesItem.type === 'line' && categoryCount > 50 ? {
      symbol: 'none',
      smooth: false,
      lineStyle: { width: 1.5 },
      step: false
    } : {})
  }))
  
  // ============ BUILD FINAL CONFIG ============
  const chartConfig = {
    title: {
      show: true,
      text: config.title || '',
      subtext: config.subtitle || '',
      left: 'left',
      top: titleTop,
      textStyle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      subtextStyle: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      itemGap: 8
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        fontSize: 12,
        color: '#374151'
      },
      formatter: function(params) {
        if (!params || params.length === 0) return ''
        const fullDate = categories[params[0].dataIndex]
        let result = `<strong>${fullDate}</strong><br/>`
        params.forEach(p => {
          result += `${p.marker} ${p.seriesName}: ${p.value}<br/>`
        })
        return result
      }
    },
    legend: {
      data: config.series.map(s => s.name),
      orient: 'horizontal',
      left: 'left',
      top: legendTop,
      itemWidth: 25,
      itemHeight: 14,
      textStyle: {
        fontSize: 12,
        color: '#4b5563'
      },
      formatter: function(name) {
        const s = (config.series || []).find(ss => ss.name === name) || {}
        const raw = s.label || name || ''
        const cleaned = String(raw).replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
        return cleaned.length ? (cleaned.charAt(0).toUpperCase() + cleaned.slice(1)) : ''
      }
    },
    grid: {
      left: '8%',
      right: '8%',
      bottom: bottomMargin,
      top: gridTop,
      containLabel: true,
      borderWidth: 0,
      backgroundColor: 'transparent'
    },
    xAxis: {
      type: 'category',
      data: categories,
      name: config.xAxis?.title || 'Date',  // default to 'Date' if not provided
      // use 'middle' so the axis title sits closer to labels and avoids clipping
      nameLocation: 'middle',
      nameGap: 35, // distance between axis labels and heading
      nameTextStyle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6b7280'
      },
      axisLabel: {
        rotate: labelRotate,
        interval: labelInterval,
        fontSize: labelFontSize,
        color: '#6b7280',
        margin: axisLabelMargin,
        formatter: labelFormatter,
        overflow: 'truncate',
        hideOverlap: true
      },
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
          width: 1
        }
      },
      axisTick: {
        show: false
      }
    },
    yAxis: [
      {
        type: 'value',
        name: config.yAxis?.title || '',
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: {
          fontSize: 12,
          fontWeight: '500',
          color: '#6b7280'
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            width: 1,
            type: 'dashed'
          }
        },
        axisLabel: {
          fontSize: 11,
          color: '#6b7280'
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        }
      },
      {
        type: 'value',
        name: config.y2Axis?.title || '',
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: {
          fontSize: 12,
          fontWeight: '500',
          color: '#6b7280'
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          fontSize: 11,
          color: '#6b7280'
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        }
      }
    ],
    series: series
  }
  
  // Add dataZoom for Sales Trend with 60+ days
  if (isSalesTrend && categoryCount > 60) {
    chartConfig.dataZoom = [{
      type: 'slider',
      start: 0,
      end: 30,
      xAxisIndex: [0],
      bottom: 20,
      height: 25,
      handleSize: '80%',
      brushSelect: true,
      zoomLock: false
    }]
  }
  
  return chartConfig
}




onMounted(async () => {
  if (chartRef.value && props.config) {
    const ecConfig = convertToEChartsConfig(props.config)
    const echarts = await getEcharts()
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(ecConfig)
    
    // Add section break line - position adjusted based on computed legend/grid positions
    const hasTitle = props.config.title && props.config.title !== ''
    const hasSubtitle = props.config.subtitle && props.config.subtitle !== ''
    const hasLegend = props.config.series && props.config.series.length > 0
    const titleTop = hasTitle ? 12 : 6
    const titleHeight = hasTitle ? 22 : 0
    const subtitleHeight = hasSubtitle ? 16 : 0
    const legendTop = hasLegend ? (titleTop + titleHeight + subtitleHeight + 8) : (titleTop + titleHeight)
    const lineYPosition = legendTop + (hasLegend ? 28 : 18)

    chartInstance.setOption({
      graphic: [
        {
          type: 'line',
          shape: {
            x1: 0,
            y1: lineYPosition,
            x2: chartRef.value.clientWidth,
            y2: lineYPosition
          },
          style: {
            stroke: '#e5e7eb',
            lineWidth: 1
          },
          z: 100
        }
      ]
    })
    
    // Click handler
    chartInstance.on('click', function(params) {
      console.log('=== ECHARTS CLICK EVENT ===')
      console.log('Chart Name:', props.config.title)
      console.log('Component Type:', params.componentType)
      console.log('Series Name:', params.seriesName)
      console.log('Name:', params.name)
      console.log('Value:', params.value)
      
      let clickedValue = null
      
      if (params.name) {
        clickedValue = params.name
        console.log('✅ Extracted value:', clickedValue)
      }
      
      if (!clickedValue && params.componentType === 'xAxis') {
        clickedValue = params.value
        console.log('✅ Extracted from xAxis:', clickedValue)
      }
      
      if (clickedValue) {
        emit('click', { territory: clickedValue })
      } else {
        console.warn('❌ No value found')
      }
    })
    
    // Update graphic line on resize
    const handleResizeLine = () => {
      if (chartInstance && chartRef.value) {
        const hasTitle = props.config.title && props.config.title !== ''
        const hasSubtitle = props.config.subtitle && props.config.subtitle !== ''
        const hasLegend = props.config.series && props.config.series.length > 0
        const titleTop = hasTitle ? 12 : 6
        const titleHeight = hasTitle ? 22 : 0
        const subtitleHeight = hasSubtitle ? 16 : 0
        const legendTop = hasLegend ? (titleTop + titleHeight + subtitleHeight + 8) : (titleTop + titleHeight)
        const lineYPosition = legendTop + (hasLegend ? 28 : 18)

        chartInstance.setOption({
          graphic: [
            {
              type: 'line',
              shape: {
                x1: 0,
                y1: lineYPosition,
                x2: chartRef.value.clientWidth,
                y2: lineYPosition
              },
              style: {
                stroke: '#e5e7eb',
                lineWidth: 1
              }
            }
          ]
        })
      }
    }
    
    window.addEventListener('resize', handleResizeLine)
    
    onUnmounted(() => {
      window.removeEventListener('resize', handleResizeLine)
    })
  }

  // When config changes we should also update graphic line position so header spacing remains consistent
})

watch(() => props.config, (newConfig) => {
  if (chartInstance && newConfig) {

      // recompute graphic line after applying new config
      if (chartRef.value) {
        const hasTitle = newConfig.title && newConfig.title !== ''
        const hasSubtitle = newConfig.subtitle && newConfig.subtitle !== ''
        const hasLegend = newConfig.series && newConfig.series.length > 0
        const titleTop = hasTitle ? 12 : 6
        const titleHeight = hasTitle ? 22 : 0
        const subtitleHeight = hasSubtitle ? 16 : 0
        const legendTop = hasLegend ? (titleTop + titleHeight + subtitleHeight + 8) : (titleTop + titleHeight)
        const lineYPosition = legendTop + (hasLegend ? 28 : 18)

        chartInstance.setOption({
          graphic: [
            {
              type: 'line',
              shape: {
                x1: 0,
                y1: lineYPosition,
                x2: chartRef.value.clientWidth,
                y2: lineYPosition
              },
              style: {
                stroke: '#e5e7eb',
                lineWidth: 1
              }
            }
          ]
        })
      }
    const ecConfig = convertToEChartsConfig(newConfig)
    chartInstance.setOption(ecConfig, true)
  }
}, { deep: true })

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
</script>