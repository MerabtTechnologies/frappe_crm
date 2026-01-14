<template>
  <div class="flex flex-col gap-3">
    <div v-if="rows.length" class="flex flex-col gap-2">
      <div class="grid grid-cols-12 gap-2 items-center font-medium text-sm">
        <div class="col-span-1"></div>
        <div class="col-span-3">{{ __('Payment Date') }}</div>
        <div class="col-span-4">{{ __('Amount') }}</div>
        <div class="col-span-3">{{ __('Remarks') }}</div>
        <div class="col-span-1"></div>
      </div>

      <div v-for="(row, idx) in rows" :key="row.name" class="grid grid-cols-12 gap-2 items-center">
        <div class="col-span-1 text-sm text-ink-gray-6">{{ idx + 1 }}</div>
        <div class="col-span-3">
          <DatePicker
            :value="row.payment_date"
            input-class="w-full"
            variant="outline"
            @update:modelValue="(v) => updateRow(idx, 'payment_date', v)"
          />
        </div>
        <div class="col-span-4">
          <FormControl
            type="currency"
            :value="formatCurrency(row.paid_amount)"
            @update:modelValue="(v) => updateRow(idx, 'paid_amount', v)"
            @change="(e) => updateRow(idx, 'paid_amount', e.target?.value ?? e)"
            placeholder="0"
          />
        </div>
        <div class="col-span-3">
          <FormControl
            type="text"
            :value="row.remarks"
            @update:modelValue="(v) => updateRow(idx, 'remarks', v)"
            @change="(e) => updateRow(idx, 'remarks', e.target?.value ?? e)"
            placeholder="Remarks"
          />
        </div>
        <div class="col-span-1">
          <Button theme="red" variant="subtle" icon="trash-2" @click="removeRow(idx)" />
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center mt-2">
      <div class="text-sm text-ink-gray-6">{{ __('Total Sum') }}: <strong>{{ formattedTotal }}</strong></div>
      <div class="flex gap-2">
        <Button :label="__('Add Payment')" @click="addRow" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { DatePicker, Button, dayjs } from 'frappe-ui'
import { getRandom } from '@/utils'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const rows = ref((props.modelValue || []).map((r) => ({ ...r })))

// prevent recursive emits when syncing from parent props
const syncingFromProps = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    syncingFromProps.value = true
    rows.value = (v || []).map((r) => ({ ...r }))
    // allow the microtask queue to settle before turning off syncing
    nextTick(() => (syncingFromProps.value = false))
  },
  { deep: true }
)

watch(
  rows,
  (v) => {
    if (syncingFromProps.value) return
    emit('update:modelValue', v)
  },
  { deep: true },
)

function addRow() {
  rows.value.push({
    name: getRandom(10),
    payment_date: dayjs().format('YYYY-MM-DD'),
    paid_amount: 0,
    remarks: '',
  })
}

function removeRow(idx) {
  rows.value.splice(idx, 1)
}

function updateRow(idx, key, value) {
  if (!rows.value[idx]) return
  const raw = typeof value === 'object' && value?.target ? value.target.value : value

  if (key === 'paid_amount') {
    // strip non-numeric characters (currency symbol, commas, spaces)
    const cleaned = String(raw).replace(/[^0-9.-]/g, '')
    rows.value[idx][key] = cleaned === '' ? 0 : Number(cleaned)
  } else {
    rows.value[idx][key] = raw
  }
}

const total = computed(() => rows.value.reduce((s, r) => s + Number(r.paid_amount || 0), 0))
function formatCurrency(amount) {
  const n = Number(amount || 0)
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)
  } catch (e) {
    return '₹' + String(n.toFixed(2))
  }
}

const formattedTotal = computed(() => formatCurrency(total.value))
</script>

<style scoped>
.grid > * { align-items: center; }
</style>
