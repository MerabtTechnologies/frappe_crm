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
    <div
        v-else-if="item.type == 'axis_chart'"
        class="h-full w-full rounded-md bg-surface-white shadow cursor-pointer"
      >
        <AxisEchart 
          v-if="item.data" 
          :config="item.data"
          @click="handleAxisChartClick"
        />
      </div>
      <!-- <AxisChart v-if="item.data" :config="item.data" /> -->
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
      
      <!-- <DonutChart v-if="item.data" :config="item.data"  -->
      
      <ClickableDonutChart 
          v-if="item.data" 
          :config="item.data" 
          @click="handleEChartClick"
        />
    </div>
     <!-- Download icon button -->
    </div>
  </div>
</template>
<script setup>


//------- For Download Excel Data For donut Chart--------

import { AxisChart, Button, NumberChart, Tooltip } from 'frappe-ui'
import { computed, inject } from 'vue'
import { createResource} from 'frappe-ui'
import { usersStore } from '@/stores/users'
import { useRouter } from 'vue-router'
import AxisEchart from './AxisEchart.vue'
import ClickableDonutChart from './Echart.vue' 

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

async function getUserEmailFromName(fullName) {
  return new Promise((resolve, reject) => {
    const getUserEmail = createResource({
      url: 'frappe.client.get_value',
      params: {
        doctype: 'User',
        filters: { full_name: fullName },
        fieldname: 'name'
      },
      auto: false,
      onSuccess: (data) => {
        if (data && data.name) {
          resolve(data.name) // Return email
        } else {
          resolve(null)
        }
      },
      onError: (err) => {
        console.error('Error fetching user email:', err)
        reject(err)
      }
    })
    
    getUserEmail.fetch()
  })
}

const router = useRouter()
// Simple cache for full_name -> email lookups to avoid repeated requests
const userEmailCache = {}

// Helper function to apply user filter
async function applyUserFilter(filtersArray, routeName) {
  const owner = filters?.user || null
  
  if (owner && (routeName === 'Leads' || routeName === 'Deals' || routeName === 'Tasks' || routeName === 'Call Logs')) {
    if (owner === 'Unassigned') {
      let field = ''
      if (routeName === 'Leads') field = 'lead_owner'
      else if (routeName === 'Deals') field = 'deal_owner'
      else if (routeName === 'Tasks') field = 'owner'
      else if (routeName === 'Call Logs') field = 'owner'
      
      if (field) {
        filtersArray.push({ fieldname: field, condition: 'is', value: 'not set' })
      }
    } else if (owner !== 'Total') {
      let email = userEmailCache[owner]
      if (!email) {
        try {
          email = await getUserEmailFromName(owner)
          if (email) userEmailCache[owner] = email
        } catch (err) {
          console.error('Error fetching email for owner:', err)
        }
      }
      
      let field = ''
      if (routeName === 'Leads') field = 'lead_owner'
      else if (routeName === 'Deals') field = 'deal_owner'
      else if (routeName === 'Tasks') field = 'owner'
      else if (routeName === 'Call Logs') field = 'owner'
      
      if (field) {
        filtersArray.push({ fieldname: field, condition: 'equals', value: email || owner })
      }
    }
  }
}

// -----Filter handling for chart click starts here-------
async function handleChartClick() {
  const chartName = props.item?.name
  const owner = filters?.user || null

  if (!chartName) {
    console.error('Chart name missing')
    return
  }

  const filtersArray = []
  let routeName = ''

  // ✅ STATUS (based on chart)
  if (chartName === 'open_leads') {
    routeName = 'Leads'
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: 'Open'
    })
  }
  else if (chartName === 'converted_leads') {
    routeName = 'Leads'
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: 'Converted'
    })
  }
  else if (chartName === 'lost_leads') {
    routeName = 'Leads'
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: 'Lost'
    })
    
  }
  else if (chartName === 'total_leads' || chartName === 'our_total_leads') {
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
  else if (chartName === 'total_qualified_leads') {
    routeName = 'Leads'
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: 'Qualified'
    })
    filtersArray.push({
      fieldname: 'custom_customer',
      condition: 'is',
      value: 'not set'
    })
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
  else if (chartName === 'total_call_logs_count') {
    routeName = 'Call Logs'

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
  else if (chartName === 'total_incoming_call_logs_count') {
    routeName = 'Call Logs'

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

    filtersArray.push({
      fieldname: 'type',
      condition: 'equals',
      value: 'Incoming'
    })
  }
  else if (chartName === 'total_outgoing_call_logs_count') {
    routeName = 'Call Logs' 

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

    filtersArray.push({
      fieldname: 'type',
      condition: 'equals',
      value: 'Outgoing'
    })
  }
  else if (chartName === 'average_call_duration') {
    routeName = 'Call Logs'

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

    filtersArray.push({
      fieldname: 'duration',
      condition: 'is',
      value: 'set'
    })
  }
  else {
    console.warn('Unhandled chart:', chartName)
    return
  }

  // ✅ Add date filters for charts that don't have special date handling
  const skipDateCharts = ['average_won_deal_value', 'average_time_to_close_a_deal']
  if (!skipDateCharts.includes(chartName) && routeName !== 'Call Logs') {
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

  // ✅ Apply user filter for all charts
  await applyUserFilter(filtersArray, routeName)

  router.push({
    name: routeName,
    query: {
      filters: JSON.stringify(filtersArray)
    }
  })
}

// ------------End--------------------

// -----Filter handling for Vue E chart click starts here-------
async function handleEChartClick(segment) {
  const chartName = props.item?.name

  if (!chartName || !segment) {
    return
  }

  const filtersArray = []
  let routeName = ''
  const value = segment.name  // ✅ IMPORTANT FIX

  if (chartName === 'leads_by_source') {
    routeName = 'Leads'

    filtersArray.push({
      fieldname: 'source',
      condition: 'equals',
      value: value
    })
  }
  else if (chartName === 'deals_by_source') {
    routeName = 'Deals'
    
    if (value === 'Empty') {
      filtersArray.push({
        fieldname: 'source',
        condition: 'is',
        value: 'not set'
      })
    } else {
      filtersArray.push({
        fieldname: 'source',
        condition: 'equals',
        value: value
      })
    }
  }
  else if (chartName === 'deals_by_stage_donut') {
    routeName = 'Deals'
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: value
    })
  } 
  else if (chartName === 'user_status_leads') {
    routeName = 'Leads'
    
    if (value === 'Qualified') {
      filtersArray.push({
        fieldname: 'status',
        condition: 'equals',
        value: 'Qualified'
      })
    } else if (value === 'Other') {
      filtersArray.push({
        fieldname: 'status',
        condition: '!=',
        value: 'Qualified'
      })
    }
    
    filtersArray.push({
      fieldname: 'custom_customer',
      condition: 'is',
      value: 'not set'
    })
  }
  else if (chartName === 'tasks_by_stage') {
    routeName = 'Tasks'
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: value
    })
  }
  else if (chartName === 'deals_by_stage_deal_value') {
    routeName = 'Deals'
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: value
    })
    filtersArray.push({
      fieldname: 'deal_value',
      condition: 'is',
      value: 'set'
    })
  }
  else if (chartName === 'won_deals_by_source_for_owner_donut') {
    routeName = 'Deals' 
    if (value === 'Not Assigned') {
      filtersArray.push({
        fieldname: 'source',
        condition: 'is',
        value: 'not set'
      })
    } else {
      filtersArray.push({
        fieldname: 'source',
        condition: 'equals',
        value: value
      })
    }
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: 'Won'
    })
  }
  else {
    console.warn('Unhandled donut chart:', chartName)
    return
  }

  // ✅ Add date filters
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

  // ✅ Apply user filter
  await applyUserFilter(filtersArray, routeName)

  router.push({
    name: routeName,
    query: {
      filters: JSON.stringify(filtersArray)
    }
  })
}

// -----Filter handling for Axis chart click starts here-------
async function handleAxisChartClick({ territory }) {
  const chartName = props.item?.name
  if (!chartName) {
    console.error('No chart name')
    return
  }
  
  const filtersArray = []
  let routeName = ''
  
  // Leads by Source Performance
  if (chartName === 'leads_by_source_performance') {
    routeName = 'Leads'
    
    if (territory && territory !== 'null' && territory !== 'undefined' && territory !== '') {
      const sourceName = territory
      
      if (sourceName === 'Not Assigned') {
        filtersArray.push({
          fieldname: 'source',
          condition: 'is',
          value: 'not set'
        })
      } else {
        filtersArray.push({
          fieldname: 'source',
          condition: '=',
          value: sourceName
        })
      }
      
      filtersArray.push({
        fieldname: 'custom_customer',
        condition: 'is',
        value: 'not set'
      })
    } else {
      console.error('❌ No source received')
      return
    }
  }
  // Deals by Territory
  else if (chartName === 'deals_by_territory') {
    routeName = 'Deals'
    
    if (territory && territory !== 'null' && territory !== 'undefined' && territory !== '') {
      if (territory === 'Empty' || territory === 'Not Assigned') {
        filtersArray.push({
          fieldname: 'territory',
          condition: 'is',
          value: 'not set'
        })
      } else {
        filtersArray.push({
          fieldname: 'territory',
          condition: '=',
          value: territory
        })
      }
    }
  }
  // Deals by Salesperson
  else if (chartName === 'deals_by_salesperson') {
    routeName = 'Deals'
    
    const salespersonName = territory  
    
    if (salespersonName && salespersonName !== 'null' && salespersonName !== 'undefined' && salespersonName !== '') {
      let email = userEmailCache[salespersonName]
      if (!email) {
        try {
          email = await getUserEmailFromName(salespersonName)
          if (email) userEmailCache[salespersonName] = email
        } catch (err) {
          console.error('Error fetching email for salesperson:', err)
        }
      }
      
      filtersArray.push({
        fieldname: 'deal_owner',
        condition: '=',
        value: email || salespersonName
      })
    } else {
      console.error('❌ No valid salesperson received')
      return
    }
  }
  // Lost deal reasons
  else if (chartName === 'lost_deal_reasons') {
    routeName = 'Deals'
    
    if (territory && territory !== 'null' && territory !== 'undefined' && territory !== '') {
      filtersArray.push({
        fieldname: 'lost_reason',
        condition: '=',
        value: territory
      })
      
      filtersArray.push({
        fieldname: 'status',
        condition: '=',
        value: 'Lost'
      })
    } else {
      console.error('❌ No lost reason received')
      return
    }
  }
  // Conversion ratio by salesperson
  else if (chartName === 'conversion_ratio_by_salesperson') {
    let salesperson = territory
    routeName = 'Deals'
    
    if (salesperson === 'Unknown') {
      filtersArray.push({
        fieldname: 'deal_owner',
        condition: 'in',
        value: ['', null]
      })
    } 
    else if (salesperson && salesperson !== 'null' && salesperson !== 'undefined' && salesperson !== '') {
      let email = userEmailCache[salesperson]
      if (!email) {
        try {
          email = await getUserEmailFromName(salesperson)
          if (email) userEmailCache[salesperson] = email
        } catch (err) {
          console.error('Error fetching email for salesperson:', err)
        }
      }

      filtersArray.push({
        fieldname: 'deal_owner',
        condition: '=',
        value: email || salesperson
      })
    } else {
      console.error('❌ No valid salesperson received')
      return
    }
  }
  // Deal Value by Stage
  else if (chartName === 'deal_value_by_stage') {
    routeName = 'Deals'
    
    const stageName = territory  
    
    if (stageName && stageName !== 'null' && stageName !== 'undefined' && stageName !== '') {
      filtersArray.push({
        fieldname: 'status',
        condition: '=',
        value: stageName
      })
      filtersArray.push({
        fieldname: 'deal_value',
        condition: 'is',
        value: 'set'
      })
    }
  }
  else {
    console.warn('Unhandled axis chart:', chartName)
    return
  }

  // ✅ Add date filters for all axis charts
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

  // ✅ Apply user filter for all axis charts
  await applyUserFilter(filtersArray, routeName)

  router.push({
    name: routeName,
    query: {
      filters: JSON.stringify(filtersArray)
    }
  })
}

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