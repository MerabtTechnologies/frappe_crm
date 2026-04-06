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
else if (chartName === 'total_call_logs_count') {
  routeName = 'Call Logs'

  filtersArray.length = 0

  if (fromDate?.value && toDate?.value) {
    filtersArray.push({
      fieldname: 'creation', // ✅ IMPORTANT (not call_datetime)
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

  filtersArray.length = 0

  if (fromDate?.value && toDate?.value) {
    filtersArray.push({
      fieldname: 'creation', // ✅ IMPORTANT (not call_datetime)
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
  
  filtersArray.length = 0

  if (fromDate?.value && toDate?.value) {
    filtersArray.push({
      fieldname: 'creation', // ✅ IMPORTANT (not call_datetime)
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
  // Route to Call Logs and apply date filters — show only records with duration set
  routeName = 'Call Logs'

  filtersArray.length = 0

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

  // Only include call logs where duration is set
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

  router.push({
    name: routeName,
    query: {
      filters: JSON.stringify(filtersArray)
    }
  })
}

// ------------End--------------------



// -----Filter handling for Vue E chart click starts here-------
function handleEChartClick(segment) {

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
      value: value   // ✅ use segment.name
    })

    // Date filter
    if (fromDate?.value && toDate?.value) {
      filtersArray.push({
        fieldname: 'creation',
        condition: 'between',
        value: [fromDate.value, toDate.value]
      })
    }
  }
    else if (chartName === 'deals_by_source') {
    routeName = 'Deals'
    
    // Handle 'Empty' source (deals with no source set)
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
// ✅ Handle Qualified Lead Status
else if (chartName === 'user_status_leads') {
  routeName = 'Leads'
  
  if (value === 'Qualified') {
    // Show only qualified leads
    filtersArray.push({
      fieldname: 'status',
      condition: 'equals',
      value: 'Qualified'
    })
  } else if (value === 'Other') {
    // Show all leads EXCEPT qualified
    filtersArray.push({
      fieldname: 'status',
      condition: '!=',
      value: 'Qualified'
    })
  }
  
  // Add the customer filter (empty customer - only ours)
  filtersArray.push({
    fieldname: 'custom_customer',
    condition: 'is',
    value: 'not set'
  })
  
  // Date filter
  if (fromDate?.value && toDate?.value) {
    filtersArray.push({
      fieldname: 'creation',
      condition: 'between',
      value: [fromDate.value, toDate.value]
    })
  }
}

else if (chartName === 'tasks_by_stage') {
  routeName = 'Tasks'
  filtersArray.push({
    fieldname: 'status',
    condition: 'equals',
    value: value
  })
  // Date filter
  if (fromDate?.value && toDate?.value) {
    filtersArray.push({       
      fieldname: 'creation',
      condition: 'between',
      value: [fromDate.value, toDate.value]
    })
  } 
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
  // Date filter
  if (fromDate?.value && toDate?.value) {
    filtersArray.push({
      fieldname: 'creation',
      condition: 'between',   
      value: [fromDate.value, toDate.value]
    })
  }
}

// ✅ Handle Won Deals by Source
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

  // Date filter
  if (fromDate?.value && toDate?.value) {
    filtersArray.push({
      fieldname: 'creation',
      condition: 'between',
      value: [fromDate.value, toDate.value]
    })
  }

  
  // Check for hidden characters
  if (value) {
    console.log('Character codes:', [...value].map(c => c.charCodeAt(0)));
  }
  console.log('Won Deals by Source filters:', filtersArray)
  
  router.push({
    name: 'Deals',
    query: { filters: JSON.stringify(filters) }
  })
}

  router.push({
    name: routeName,
    query: {
      filters: JSON.stringify(filtersArray)
    }
  })
}


// -----Filter handling for Axis chart click starts here-------
// -----Filter handling for Axis chart click starts here-------
function handleAxisChartClick({ territory }) {
  const chartName = props.item?.name
  if (!chartName) {
    console.error('No chart name')
    return
  }
  
  const filtersArray = []
  let routeName = ''
  
  // ========== LEAD SOURCE PERFORMANCE (PUT THIS FIRST FOR TESTING) ==========
  // Leads by Source Performance has some unique handling so we are putting it first to test and verify before other charts (as they are working fine)
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
      
      if (fromDate?.value && toDate?.value) {
        filtersArray.push({
          fieldname: 'creation',
          condition: 'between',
          value: [fromDate.value, toDate.value]
        })
      }
      
      router.push({
        name: routeName,
        query: {
          filters: JSON.stringify(filtersArray)
        }
      })
      return
    } else {
      console.error('❌ No source received')
      return
    }
  }
  
  // ========== DEALS BY TERRITORY ==========
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
    
    if (fromDate?.value && toDate?.value) {
      filtersArray.push({
        fieldname: 'creation',
        condition: 'between',
        value: [fromDate.value, toDate.value]
      })
    }
    
    router.push({
      name: routeName,
      query: {
        filters: JSON.stringify(filtersArray)
      }
    })
  }
  
  // ========== DEALS BY SALESPERSON ==========
  else if (chartName === 'deals_by_salesperson') {
    routeName = 'Deals'
    
    const salespersonName = territory  
    
    if (salespersonName && salespersonName !== 'null' && salespersonName !== 'undefined' && salespersonName !== '') {
      const getUserEmail = createResource({
        url: 'frappe.client.get_value',
        params: {
          doctype: 'User',
          filters: { full_name: salespersonName },
          fieldname: 'name'  
        },
        auto: false,
        onSuccess: (data) => {
          if (data && data.name) {
            const email = data.name  
            
            filtersArray.push({
              fieldname: 'deal_owner',
              condition: '=',
              value: email
            })          
            
            if (fromDate?.value && toDate?.value) {
              filtersArray.push({
                fieldname: 'creation',
                condition: 'between',
                value: [fromDate.value, toDate.value]
              })
            }
            
            router.push({
              name: routeName,
              query: {
                filters: JSON.stringify(filtersArray)
              }
            })
          }
        },
        onError: (err) => {
          console.error('Error fetching user email:', err)
        }
      })
      
      getUserEmail.fetch()
      return  
    }
  }
  // Lost deal reasons chart click handling
else if (chartName === 'lost_deal_reasons'){
  routeName = 'Deals'
  
  if (territory && territory !== 'null' && territory !== 'undefined' && territory !== '') {
    filtersArray.push({
      fieldname: 'lost_reason',
      condition: '=',
      value: territory
    })
    
    if (fromDate?.value && toDate?.value) {
      filtersArray.push({
        fieldname: 'creation',
        condition: 'between',
        value: [fromDate.value, toDate.value]
      })
    }
    filtersArray.push({
      fieldname: 'status',
      condition: '=',
      value: 'Lost'
    })  
  
    router.push({
      name: routeName,
      query: {
        filters: JSON.stringify(filtersArray)
      }
    })
  } else {
    console.error('❌ No lost reason received')
    return
  }
}

// Conversion ratio by salesperson click handling

else if (chartName === 'conversion_ratio_by_salesperson') {
  
  let salesperson = territory
  routeName = 'Deals'
  const filtersArray = []
  
  // Handle "Unknown" case
  if (salesperson === 'Unknown') {
    filtersArray.push({
      fieldname: 'deal_owner',
      condition: 'in',
      value: ['', null]
    })
  } 
  // Handle valid salesperson
  else if (salesperson && salesperson !== 'null' && salesperson !== 'undefined' && salesperson !== '') {
    filtersArray.push({
      fieldname: 'deal_owner',
      condition: '=',
      value: salesperson
    })
  } else {
    console.error('❌ No valid salesperson received')
    return
  }
  
  // Add date filter
  if (fromDate?.value && toDate?.value) {
    filtersArray.push({
      fieldname: 'creation',
      condition: 'between',
      value: [fromDate.value, toDate.value]
    })
  }
  
  
  // Check if router exists
  if (!router) {
    console.error('❌ Router is not defined!')
    return
  }
  
  router.push({
    name: routeName,
    query: {
      filters: JSON.stringify(filtersArray)
    }
  })
  return
}
// Deal Value by Stage click handling
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
    
    if (fromDate?.value && toDate?.value) {
      filtersArray.push({
        fieldname: 'creation',
        condition: 'between',
        value: [fromDate.value, toDate.value]
      })
    }
  }
  
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
