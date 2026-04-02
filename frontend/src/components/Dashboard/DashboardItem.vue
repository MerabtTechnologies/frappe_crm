<template>
  <div class="h-full w-full">
    <div
      v-if="item.type == 'number_chart'"
      class="flex h-full w-full rounded shadow overflow-hidden cursor-pointer"
    >
      <Tooltip :text="__(item.data.tooltip)">
        <NumberChart
          class="!items-start"
          v-if="item.data"
          :key="index"
          :config="item.data"
          @click="handleChartClick"
        />
      </Tooltip>
      <!-- Download icon button -->
      <div class="ml-auto">
        
        <Button v-if="false"
            class="absolute top-2 right-2 z-10"
            variant="outline"
            icon="download"
            @click.stop="downloadExcel"
          />


      </div>
      <!-- Button div end here -->
    </div>
    <div
      v-else-if="item.type == 'spacer'"
      class="rounded bg-surface-white h-full overflow-hidden text-ink-gray-5 flex items-center justify-center"
      :class="editing ? 'border border-dashed border-outline-gray-2' : ''"
    >
      {{ editing ? __('Spacer') : '' }}
    </div>
    <div
      v-else-if="item.type == 'axis_chart'"
      class="h-full w-full rounded-md bg-surface-white shadow"
    >
      <!-- Download icon button -->
      <Button v-if ="false"
        class="absolute top-2 right-2 z-10"
        variant="outline"
        icon="download"
        @click.stop="downloadExcel"
        
      />
      <!-- end here -->
      <AxisChart v-if="item.data" :config="item.data" />
    </div>
    <div
      v-else-if="item.type == 'donut_chart'"
      class="h-full w-full rounded-md bg-surface-white shadow overflow-hidden"
    >
    <div class="h-full w-full relative">
    <!-- Download icon button -->
      <Button v-if="false"
        class="absolute top-2 right-2 z-10"
        variant="outline"
        icon="download"
        @click.stop="downloadExcel"
      />
      
      <DonutChart v-if="item.data" :config="item.data" />
  </div>
     <!-- Download icon button -->
    </div>
  </div>
</template>
<script setup>


//------- For Download Excel Data For donut Chart--------

import { AxisChart, Button, DonutChart, NumberChart, Tooltip } from 'frappe-ui'
import { computed, inject } from 'vue'
import { createResource} from 'frappe-ui'
import { usersStore } from '@/stores/users'
import { useRouter } from 'vue-router'

const { isSalesMasterManager } = usersStore()

const downloadExcelResource = createResource({
  url: 'merabt_crm.merabt_crm.override.custom_chart.download_donut_chart_excel',
  auto: false,
  onSuccess(res) {
    if (res?.file_url) {
      window.open(res.file_url)
    }
  },
})

const enableButton = computed(() => {
  if (isSalesMasterManager()) {
    return true
  }
  return false
})

const downloadExcelResourceNumberChart = createResource({
  url: 'merabt_crm.merabt_crm.override.custom_chart.download_number_chart_excel',
  auto: false,
  onSuccess(res) {
    if (res?.file_url) {
      window.open(res.file_url)
    }
  },
})  

const downloadExcelResourceAxisChart = createResource({
  url: 'merabt_crm.merabt_crm.override.custom_chart.download_axis_chart_excel',
  auto: false,
  onSuccess(res) {
    if (res?.file_url) {
      window.open(res.file_url)
    }
  },
})


function downloadExcel() {
  if (!props.item?.name) {
    console.error('Chart name missing')
    return
  }

  const payload = {
    name: props.item.name,
    from_date: fromDate?.value,
    to_date: toDate?.value,
    user: filters?.user,
  }

  if (props.item.type === 'donut_chart') {
    downloadExcelResource.fetch(payload)
  }
  else if (props.item.type === 'number_chart') {
    downloadExcelResourceNumberChart.fetch(payload)
  }
  else if (props.item.type === 'axis_chart') {
    downloadExcelResourceAxisChart.fetch(payload)
  }
}

const fromDate = inject('fromDate', null)
const toDate = inject('toDate', null)
const filters = inject('filters', null)

// ------download excel code ends here -------


const router = useRouter()



// -----Filter handling for chart click starts here-------
function handleChartClick() {
  const chartName = props.item?.name
  const owner = filters?.user || null

  if (!chartName) {
    console.error('Chart name missing')
    return
  }

  const filtersArray = []

  // ✅ STATUS (based on chart)
  if (chartName === 'open_leads') {
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: 'Open'
    })
  }
  else if (chartName === 'converted_leads') {
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: 'Converted'
    })
  }
  else if (chartName === 'lost_leads') {
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: 'Lost'
    })
  }

  // ✅ DATE FILTER - Skip for average_won_deal_value, won_deals, and average_time_to_close (uses closed_date instead)
  if (chartName !== 'average_won_deal_value' && chartName !== 'won_deals' && chartName !== 'average_time_to_close_a_deal') {
    if (fromDate?.value && toDate?.value) {
      filtersArray.push({
        fieldname: 'creation',
        condition: 'between',
        value: [fromDate.value, toDate.value]
      })
    } else if (fromDate?.value) {
      filtersArray.push({
        fieldname: 'creation',
        condition: '>=',
        value: fromDate.value
      })
    } else if (toDate?.value) {
      filtersArray.push({
        fieldname: 'creation',
        condition: '<=',
        value: toDate.value
      })
    }
  }

  // ✅ OWNER FILTER
  if (owner === 'Unassigned') {
    filtersArray.push({
      fieldname: 'lead_owner',
      condition: 'is',
      value: 'not set'
    })
  } 
  else if (owner && owner !== 'Total') {
    filtersArray.push({
      fieldname: 'lead_owner',
      condition: 'equals',
      value: owner
    })
  }

  // ✅ ROUTING
  let routeName = ''

  if (
    chartName === 'total_leads' ||
    chartName === 'our_total_leads' ||
    chartName === 'open_leads' ||
    chartName === 'converted_leads' 
    // chartName === 'lost_leads' ||
    // chartName === 'leads_by_source' ||
    // chartName === 'leads_by_source_performance' ||
    // chartName === 'user_status_leads' ||
    // chartName === 'leads_by_industry' || 
    // chartName === 'leads_by_territory'
  ) {
    routeName = 'Leads'
    
    // ✅ ADD CUSTOMER FILTER FOR our_total_leads
    if (chartName === 'our_total_leads') {
      filtersArray.push({
        fieldname: 'custom_customer',
        condition: 'is',
        value: 'not set'
      })
    }
  }
  else if (chartName === 'won_deals') {
    routeName = 'Deals'
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: 'Won'
    })
  }
  else if (chartName === 'total_deal_value') {
    routeName = 'Deals'
    filtersArray.push({
      fieldname: 'status',
      condition: 'Not in',  
      value: "Lost"
    })
    filtersArray.push({
      fieldname: 'deal_value',
      condition: 'is',
      value: 'set'
    })
  }
  else if (chartName === 'ongoing_deals') {
    routeName = 'Deals'
    filtersArray.push({
      fieldname: 'status',
      condition: 'Not in',  
      value: "Won, Lost"
    })
  }
  else if (chartName === 'average_ongoing_deal_value') {
    routeName = 'Deals'
    filtersArray.push({
      fieldname: 'status',
      condition: 'Not in',  
      value: "Won, Lost"
    })
    filtersArray.push({
      fieldname: 'deal_value',
      condition: 'is',
      value: 'set'
    })
  }
  else if (chartName === 'average_deal_value') {
    routeName = 'Deals'
    filtersArray.push({
      fieldname: 'status',
      condition: 'Not in',  
      value: "Lost"
    })
    filtersArray.push({
      fieldname: 'deal_value',
      condition: 'is',
      value: 'set'
    })
  }
  else if (chartName === 'average_won_deal_value') {
    routeName = 'Deals'
    // Add closed_date filter (no creation filter added due to condition above)
    if (fromDate?.value && toDate?.value) {
      filtersArray.push({
        fieldname: 'closed_date',
        condition: 'between',
        value: [fromDate.value, toDate.value]
      })
    } else if (fromDate?.value) {
      filtersArray.push({
        fieldname: 'closed_date',
        condition: '>=',
        value: fromDate.value
      })
    } else if (toDate?.value) {
      filtersArray.push({
        fieldname: 'closed_date',
        condition: '<=',
        value: toDate.value
      })
    }
    
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: 'Won'
    })
    
    filtersArray.push({
      fieldname: 'deal_value',
      condition: 'is',
      value: 'set'
    })
  }
  else if (chartName === 'average_time_to_close_a_deal') {
    routeName = 'Deals'
    // Add closed_date filter (no creation filter added due to condition above)
    if (fromDate?.value && toDate?.value) {
      filtersArray.push({
        fieldname: 'closed_date',
        condition: 'between',
        value: [fromDate.value, toDate.value]
      })
    } else if (fromDate?.value) {
      filtersArray.push({
        fieldname: 'closed_date',
        condition: '>=',
        value: fromDate.value
      })
    } else if (toDate?.value) {
      filtersArray.push({
        fieldname: 'closed_date',
        condition: '<=',
        value: toDate.value
      })
    }
    
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: 'Won'
    })
  }
  else {
    console.warn('Unhandled chart:', chartName)
    return
  }

  router.push({
    name: routeName,
    query: {
      filters: JSON.stringify(filtersArray)
    }
  })
}

// ------------End--------------------
const props = defineProps({
  index: {
    type: Number,
    required: true,
  },
  item: {
    type: Object,
    required: true,
  },
  editing: {
    type: Boolean,
    default: false,
  }

})
</script>
