<template>
  <Dialog
    v-model="show"
    :options="{ title: __('Add Chart') }"
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
          :label="__('Number Chart')"
          :options="numberCharts"
        />
        <FormControl
          v-if="chartType === 'axis_chart'"
          v-model="axisChart"
          type="select"
          :label="__('Axis Chart')"
          :options="axisCharts"
        />
        <FormControl
          v-if="chartType === 'donut_chart'"
          v-model="donutChart"
          type="select"
          :label="__('Donut Chart')"
          :options="donutCharts"
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
  { label: __('Number Chart'), value: 'number_chart' },
  { label: __('Axis Chart'), value: 'axis_chart' },
  { label: __('Donut Chart'), value: 'donut_chart' },
]

const numberChart = ref('')
const numberCharts = [
  { label: __('Total leads'), value: 'total_leads' },
  { label: __('Total leads (Only Ours)'), value: 'our_total_leads' },
  { label: __('Ongoing deals'), value: 'ongoing_deals' },
  { label: __('Avg ongoing deal value'), value: 'average_ongoing_deal_value' },
  { label: __('Won deals'), value: 'won_deals' },
  { label: __('Avg won deal value'), value: 'average_won_deal_value' },
  { label: __('Avg deal value'), value: 'average_deal_value' },
  {
    label: __('Avg Time to Close a Lead'),
    value: 'average_time_to_close_a_lead',
  },
  {
    label: __('Avg Time to Close a Deal'),
    value: 'average_time_to_close_a_deal',
  },
  { label: __('Total qualified leads'), value: 'total_qualified_leads' },
  { label: __('Total deal value'), value: 'total_deal_value' },
  { label: __('Total won deal value'), value: 'total_won_deal_value' },
  { label: __('Total won deal balance value'), value: 'total_won_deal_balance_value' },
  { label: __('Deal Target Amount'), value: 'target_amount_number_chart' },
  { label: __('Deal Achieved Amount'), value: 'achieved_amount_number_chart' },
  {label: __('Total Call Logs'), value: 'total_call_logs_count'},
  { label: __('Total Incoming Call Logs'), value: 'total_incoming_call_logs_count' },
  { label: __('Total Outgoing Call Logs'), value: 'total_outgoing_call_logs_count' },
  { label: __('Average Call Duration'), value: 'average_call_duration' },
  { label: __('Total Call Duration'), value: 'total_call_duration' },

  
]

const axisChart = ref('sales_trend')
const axisCharts = [
  { label: __('Sales trend'), value: 'sales_trend' },
  { label: __('Sales trend (Only Ours)'), value: 'our_sales_trend' },
  { label: __('Forecasted revenue'), value: 'forecasted_revenue' },
  { label: __('Funnel conversion'), value: 'funnel_conversion' },
  { label: __('Funnel conversion (Only Ours)'), value: 'our_funnel_conversion' },
  { label: __('Deals by ongoing & won stage'), value: 'deals_by_stage_axis' },
  { label: __('Lost deal reasons'), value: 'lost_deal_reasons' },
  { label: __('Deals by territory'), value: 'deals_by_territory' },
  { label: __('Deals by salesperson'), value: 'deals_by_salesperson' },
  { label: __('Conversion ratio by salesperson'), value: 'conversion_ratio_by_salesperson' },
  { label: __('Lead source performance'), value: 'leads_by_source_performance' },
  { label: __('Deal Value by Stage'), value: 'deal_value_by_stage' },
]

const donutChart = ref('deals_by_stage_donut')
const donutCharts = [
  { label: __('Deals by stage'), value: 'deals_by_stage_donut' },
  { label: __('Leads by source'), value: 'leads_by_source' },
  { label: __('Deals by source'), value: 'deals_by_source' },
  { label: __('Won Deals by Source'), value: 'won_deals_by_source_for_owner_donut'},
  { label: __('Qualified Lead Status'), value:'user_status_leads'},
  { label: __('Tasks by stage'), value:'tasks_by_stage'},
  { label: __('Deals by Stage Deal Value'), value:'deals_by_stage_deal_value'},
  { label: __('Deals Target vs Achieved'), value:'deal_with_target_vs_achieved' },


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
  let name =
    type == 'number_chart'
      ? numberChart.value
      : type == 'axis_chart'
        ? axisChart.value
        : donutChart.value

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

      if (['axis_chart', 'donut_chart'].includes(type)) {
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