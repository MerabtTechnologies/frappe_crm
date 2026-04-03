<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="quote in quotations"
      :key="quote.name"
      class="group flex items-center justify-between rounded-lg border border-outline-gray-modals bg-surface-white p-4 transition-all hover:shadow-md"
    >
      <div class="flex items-center gap-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-gray-2 text-ink-gray-7">
          <QuotationIcon class="h-5 w-5" />
        </div>
        <div class="flex flex-col" @click="oper_quo(quote)">
          <span class="text-base font-semibold text-ink-gray-9">
            {{ quote.name }}
          </span>
          <span class="text-sm text-ink-gray-5">
            {{ quote.party }} • {{ formatDate(quote.creation) }}
          </span>
        </div>
      </div>

      <div class="flex flex-col items-end gap-1">
        <div class="text-lg font-bold text-ink-gray-9">
          {{ quote.currency }} {{ formatCurrency(quote.grand_total) }}
        </div>
        <Badge
          :variant="getStatusVariant(quote.status)"
          :label="__(quote.status)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate } from '@/utils'
import QuotationIcon from '@/components/Icons/QuotationIcon.vue'
import { Badge } from 'frappe-ui'
import { useRouter } from 'vue-router'


const props = defineProps({
  doctype: String,
  docname: String,
  quotations: [Object],
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat().format(value)
}

const router = useRouter()


const getStatusVariant = (status) => {
  switch (status) {
    case 'Draft': return 'gray'
    case 'Open': return 'blue'
    case 'Ordered': return 'green'
    case 'Lost': return 'red'
    case 'Expired': return 'orange'
    default: return 'gray'
  }
}

function oper_quo(row) {
  
  router.push({
        name: 'Quotation',
        params: { quotationId: row.name },
      })
}
</script>