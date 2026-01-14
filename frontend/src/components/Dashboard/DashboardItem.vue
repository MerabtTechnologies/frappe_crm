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
