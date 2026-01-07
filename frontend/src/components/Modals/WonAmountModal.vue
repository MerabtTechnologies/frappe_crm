<template>
  <Dialog
    v-model="show"
    :options="{ title: __('Won Amount') }"
    @close="cancel"
  >
    <template #body-content>
      <div class="-mt-3 mb-4 text-p-base text-ink-gray-7">
        {{ __('Please enter the won amount and optional notes') }}
      </div>
      <div class="flex flex-col gap-3">
        <div>
          <!-- <Grid
            :modelValue="payments"
            :parent="props.deal.doc"
            doctype="CRM Deal Paid Amount"
            parentDoctype="CRM Deal"
            parentFieldname="custom_payments"
          /> -->
          <Grid 
            v-model="payments"
            v-model:parent="props.deal.doc"
            doctype="CRM Deal Paid Amount"
            parentDoctype="CRM Deal"
            parentFieldname="custom_payments"
          />
        </div>
        <div>
          <div class="mb-2 text-sm text-ink-gray-5">
            {{ __('Total Paid Amount') }}
          </div>
          <FormControl
            class="form-control flex-1 truncate"
            type="number"
            :value="totalAmount"
            :disabled="true"
          />
        </div>
        <div>
          <div class="mb-2 text-sm text-ink-gray-5">
            {{ __('Remarks') }}
          </div>
          <FormControl
            class="form-control flex-1 truncate"
            type="textarea"
            :value="wonNotes"
            @change="(e) => (wonNotes = e.target.value)"
          />
        </div>
      </div>
    </template>
    <template #actions>
      <div class="flex justify-between items-center gap-2">
        <div><ErrorMessage :message="error" /></div>
        <div class="flex gap-2">
          <Button :label="__('Cancel')" @click="cancel" />
          <Button variant="solid" :label="__('Save')" @click="save" />
        </div>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { Dialog } from 'frappe-ui'
import { ref, computed } from 'vue'
import Grid from '@/components/Controls/Grid.vue'

const props = defineProps({
  deal: {
    type: Object,
    required: true,
  },
})

const show = defineModel()

const payments = ref([])
const totalAmount = computed(() => {
  if (props.deal.doc.custom_paid_amount !== undefined && props.deal.doc.custom_paid_amount !== null) {
    return Number(props.deal.doc.custom_paid_amount)
  }
  return (props.deal.doc.custom_payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
})
const wonNotes = ref(props.deal.doc.custom_paid_amount_remarks || '')
const error = ref('')

function cancel() {
  show.value = false
  error.value = ''

}

function save() {

  // set remarks from modal input
  props.deal.doc.custom_paid_amount_remarks = wonNotes.value

  console.log(props.deal.doc);
  console.log('Payments Props: ', props.deal.doc.custom_payments);
  console.log("Payments: ", payments.value);
  
  
  
  error.value = ''
  // show.value = false
  // props.deal.save.submit()
}
</script>
