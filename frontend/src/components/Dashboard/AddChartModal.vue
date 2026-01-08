<template>
  <Dialog
    v-model="show"
    @close="show = false"
  >
    <template #body-content>
      <div class="flex flex-col gap-4">
        <FormControl
          v-model="chartType"
          type="select"
          :label="__('Chart Type')"
          :options="chartTypes"
        />
        <FormControl
          v-if="chartType === 'number_chart'"
          v-model="numberChart"
          type="select"
          :label="__('Number chart')"
          :options="numberCharts"
        />
        <FormControl
          v-if="chartType === 'axis_chart'"
          v-model="axisChart"
          type="select"
          :label="__('Axis chart')"
          :options="axisCharts"
        />
        <FormControl
          v-if="chartType === 'donut_chart'"
          v-model="donutChart"
          type="select"
          :label="__('Donut chart')"
          :options="donutCharts"
        />
        <FormControl
          v-if="chartType === 'horizontal_bar_chart'"
          v-model="horizontalChart"
          type="select"
          :label="__('Horizontal Chart')"
          :options="horizontalCharts"
        />


      </div>
    </template>
    <template #actions>
      <div class="flex items-center justify-end gap-2">
        <Button variant="outline" :label="__('Cancel')" @click="show = false" />
        <Button variant="solid" :label="__('Add')" @click="addChart" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getRandom } from '@/utils'
import { createResource, Dialog, FormControl } from 'frappe-ui'
import { ref, reactive, inject } from 'vue'

const show = defineModel({
  type: Boolean,
  default: false,
})

const items = defineModel('items', {
  type: Array,
  default: () => [],
})

const fromDate = inject('fromDate', ref(''))
const toDate = inject('toDate', ref(''))
const filters = inject('filters', reactive({ period: '', user: '' }))

const chartType = ref('spacer')
const chartTypes = [
  { label: __('Spacer'), value: 'spacer' },
  { label: __('Number chart'), value: 'number_chart' },
  { label: __('Axis chart'), value: 'axis_chart' },
  { label: __('Donut chart'), value: 'donut_chart' },
  { label: __('Horizontal Bar Chart'), value: 'horizontal_bar_chart' }


]

const numberChart = ref('')
const numberCharts = [
  { label: __('Total leads'), value: 'total_leads' },
  { label: __('Ongoing deals'), value: 'ongoing_deals' },
  { label: __('Avg ongoing deal value'), value: 'average_ongoing_deal_value' },
  { label: __('Won deals'), value: 'won_deals' },
  { label: __('Avg won deal value'), value: 'average_won_deal_value' },
  { label: __('Avg deal value'), value: 'average_deal_value' },
  {
    label: __('Avg time to close a lead'),
    value: 'average_time_to_close_a_lead',
  },
  {
    label: __('Avg time to close a deal'),
    value: 'average_time_to_close_a_deal',
  },
]

const horizontalChart = ref('')
const horizontalCharts = [
  { label: __('Deals by territory'), value: 'deals_by_territory' },
  { label: __('Deals by salesperson'), value: 'deals_by_salesperson' },
  
]


const axisChart = ref('sales_trend')
const axisCharts = [
  { label: __('Sales trend'), value: 'sales_trend' },
  { label: __('Forecasted revenue'), value: 'forecasted_revenue' },
  { label: __('Funnel conversion'), value: 'funnel_conversion' },
  { label: __('Deals by ongoing & won stage'), value: 'deals_by_stage_axis' },
  { label: __('Lost deal reasons'), value: 'lost_deal_reasons' },
  { label: __('Deals by territory'), value: 'deals_by_territory' },
  { label: __('Deals by salesperson'), value: 'deals_by_salesperson' },
]

const donutChart = ref('deals_by_stage_donut')
const donutCharts = [
  { label: __('Deals by stage'), value: 'deals_by_stage_donut' },
  { label: __('Leads by source'), value: 'leads_by_source' },
  { label: __('Deals by source'), value: 'deals_by_source' },
  { label: __('Qualified Lead Status'), value:'user_status_leads'},

]

async function addChart() {
  show.value = false
  if (chartType.value == 'spacer') {
    items.value.push({
      name: 'spacer',
      type: 'spacer',
      layout: { x: 0, y: 0, w: 4, h: 2, i: 'spacer_' + getRandom(4) },
    })
  } else {
    await getChart(chartType.value)
  }
}

async function getChart(type: string) {
  let name = ''

      if (type === 'number_chart') {
        name = numberChart.value
      } else if (type === 'axis_chart') {
        name = axisChart.value
      } else if (type === 'donut_chart') {
        name = donutChart.value
      } else if (type === 'horizontal_bar_chart') {
        name = horizontalChart.value
      }

  // let name =
  //   type == 'number_chart'
  //     ? numberChart.value
  //     : type == 'axis_chart'
  //       ? axisChart.value
  //       : donutChart.value
  //         type == 'horizontal_bar_chart'  
  //           ? horizontalChart.value
  //           : ''


  await createResource({
    url: 'crm.api.dashboard.get_chart',
    params: {
      name,
      type,
      from_date: fromDate.value,
      to_date: toDate.value,
      user: filters.user,
    },
    auto: true,
    onSuccess: (data = {}) => {
      let width = 4
      let height = 2

      if (['axis_chart', 'donut_chart','line_chart','horizontal_bar_chart'].includes(type)) {
        width = 10
        height = 7
      }

      items.value.push({
        name,
        type,
        layout: {
          x: 0,
          y: 0,
          w: width,
          h: height,
          i: name + '_' + getRandom(4),
        },
        data: data,
      })
    },
  })
}
</script>
