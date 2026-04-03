<template>
  <Dialog v-model="show" :options="{ size: '3xl' }">
    <template #body>
      <div class="bg-surface-modal px-4 pb-6 pt-5 sm:px-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h3 class="text-2xl font-semibold leading-6 text-ink-gray-9">
              {{ __('Create Quotation') }}
            </h3>
          </div>
          <div class="flex items-center gap-1">
            <Button
              v-if="isManager() && !isMobileView"
              variant="ghost"
              class="w-7"
              :tooltip="__('Edit fields layout')"
              :icon="EditIcon"
              @click="openQuickEntryModal"
            />
            <Button
              variant="ghost"
              class="w-7"
              icon="x"
              @click="show = false"
            />
          </div>
        </div>
        <div>
         
          <!-- <div
            v-if="hasOrganizationSections || hasContactSections"
            class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <div
              v-if="hasOrganizationSections"
              class="flex items-center gap-3 text-sm text-ink-gray-5"
            >
              <div>{{ __('Choose Existing Organization') }}</div>
              <Switch v-model="chooseExistingOrganization" />
            </div>
            <div
              v-if="hasContactSections"
              class="flex items-center gap-3 text-sm text-ink-gray-5"
            >
              <div>{{ __('Choose Existing Contact') }}</div>
              <Switch v-model="chooseExistingContact" />
            </div>
          </div>-->
          <div
            v-if="hasOrganizationSections || hasContactSections"
            class="h-px w-full border-t my-5"
          /> 
          <FieldLayout
            ref="fieldLayoutRef"
            v-if="tabs.data?.length"
            :tabs="tabs.data"
            :data="deal.doc"
            doctype="Quotation"
          />
          <ErrorMessage class="mt-4" v-if="error" :message="__(error)" />
        </div>
      </div>
      <div class="px-4 pb-7 pt-4 sm:px-6">
        <div class="flex flex-row-reverse gap-2">
          <Button
            variant="solid"
            :label="__('Create')"
            :loading="isDealCreating"
            @click="createDeal"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import EditIcon from '@/components/Icons/EditIcon.vue'
import FieldLayout from '@/components/FieldLayout/FieldLayout.vue'
import { usersStore } from '@/stores/users'
import { statusesStore } from '@/stores/statuses'
import { isMobileView } from '@/composables/settings'
import { showQuickEntryModal, quickEntryProps } from '@/composables/modals'
import { useDocument } from '@/data/document'
import { useTelemetry } from 'frappe-ui/frappe'
import { Switch, createResource } from 'frappe-ui'
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  defaults: Object,
  doc: String,      // This will receive doc?.name from the parent
  doctype: String,  // This will receive "CRM Deal"
  quotation: Object
})

const { getUser, isManager } = usersStore()
const { getDealStatus, statusOptions } = statusesStore()

const { capture } = useTelemetry()

const show = defineModel()
const router = useRouter()
const error = ref(null)

const { document: deal, triggerOnBeforeCreate } = useDocument('Quotation')
// const { document: deal } = useDocument('Quotation')

// 🔥 FIX: initialize child table
// if (!deal.doc.items) {
//   deal.doc.items = []
// }


const hasOrganizationSections = ref(true)
const hasContactSections = ref(true)

const isDealCreating = ref(false)
const chooseExistingContact = ref(true)
const chooseExistingOrganization = ref(true)


watch(
  [chooseExistingOrganization, chooseExistingContact],
  ([organization, contact, salesOrder]) => {
    tabs.data.forEach((tab) => {
      tab.sections.forEach((section) => {
        if (section.name === 'organization_section') {
          section.hidden = !organization
        } else if (section.name === 'organization_details_section') {
          section.hidden = organization
        } else if (section.name === 'contact_section') {
          section.hidden = !contact
        } else if (section.name === 'contact_details_section') {
          section.hidden = contact
        } 
      })
    })
  },
)
// ... your existing imports and setup

// 🔥 NEW: Watcher for Child Table (Items)
// Add this variable outside the watch to track previous values
const rowItemTracker = new Map();

watch(
  () => deal.doc.items,
  (newItems) => {
    if (!newItems) return;

    newItems.forEach((row, index) => {
      // 1. Existing Fetch Logic (Select Item)
      const rowKey = `row-${index}`;
      const previousCode = rowItemTracker.get(rowKey);

      if (row.item_code && row.item_code !== previousCode) {
        rowItemTracker.set(rowKey, row.item_code);
        fetchItemDetails(row, previousCode);
      }

      // 2. 🔥 NEW: Sync Amount (Qty * Rate)
      // This runs every time the user types in the Qty or Rate fields
      const qty = parseFloat(row.qty) || 0;
      const rate = parseFloat(row.rate) || 0;
      
      // Update the row amount dynamically
      row.amount = qty * rate;
    });
  },
  { deep: true }
);

watch(
  () => deal.doc.taxes_and_charges,
  async (newTemplate, oldTemplate) => {
    if (newTemplate) {
      console.log(`🧾 Tax Template Changed: [${oldTemplate || 'None'}] -> [${newTemplate}]`);
      // Use 'await' here so taxes are fully loaded before we calculate
      await fetchTaxTemplateDetails(newTemplate);
    } else {
      // If the user clears the template, clear the taxes table
      deal.doc.taxes = [];
    }
    
    // 🔥 Now this runs AFTER the template logic is finished
    calculateTaxes();
  }
);

// Function to fetch Item details from the backend
async function fetchItemDetails(row) {
  // Capture the old state before we do anything (optional, for the log)
  const oldItemCode = row._previous_item_code || 'None';

  try {
    console.log(`🔄 Item Change Detected: Changing from [${oldItemCode}] to [${row.item_code}]`);

    // 1. Fetch the Item Document
    const itemDoc = await createResource({
      url: 'frappe.client.get',
      params: { doctype: 'Item', name: row.item_code },
    }).submit();

    // 2. Fetch the Price
    const priceData = await createResource({
      url: 'frappe.client.get_value',
      params: {
        doctype: 'Item Price',
        filters: { 
          item_code: row.item_code, 
          price_list: deal.doc.selling_price_list || 'Standard Selling' 
        },
        fieldname: 'price_list_rate'
      },
    }).submit();

    if (itemDoc) {
      console.log(`📦 New Item Data Received for ${row.item_code}:`, itemDoc);

      // 3. Dynamic Overwrite
      Object.assign(row, {
        ...itemDoc,
        uom: itemDoc.stock_uom,
        description: itemDoc.description,
        custom__is_recurring_item: itemDoc.custom_is_recurring_item,
        warehouse: itemDoc.default_warehouse || '',
        rate: priceData?.price_list_rate || itemDoc.standard_rate || 0,
        qty: 1,
        // Store the new code as the "previous" for the next time you change it
        _previous_item_code: row.item_code 
      });

      row.amount = row.qty * row.rate;

      console.log(`✅ Row Successfully Updated. Current Row State:`, JSON.parse(JSON.stringify(row)));
    }
  } catch (err) {
    console.error("❌ Error during item re-selection:", err);
  }
}
async function fetchTaxTemplateDetails(templateName) {
  try {
    const templateDoc = await createResource({
      url: 'frappe.client.get',
      params: {
        doctype: 'Sales Taxes and Charges Template',
        name: templateName,
      },
    }).submit();

    if (templateDoc && templateDoc.taxes) {
      // Map the taxes from the template to the Quotation taxes table
      // We use .map to ensure we create fresh objects for each row
      deal.doc.taxes = templateDoc.taxes.map((tax) => {
        return {
          ...tax,
          // Ensure specific fields required by Quotation are present
          charge_type: tax.charge_type,
          account_head: tax.account_head,
          description: tax.description,
          rate: tax.rate,
          // Reset amount/base_amount so the system can re-calculate them based on items
          tax_amount: 0,
          total: 0,
        };
      });

      console.log(`✅ Taxes Child Table populated with ${deal.doc.taxes.length} rows.`);
    }
  } catch (err) {
    console.error("❌ Error fetching Tax Template:", err);
  }
}
function calculateTaxes() {
  const itemTotal = deal.doc.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  let cumulativeTotal = itemTotal;

  deal.doc.taxes.forEach((tax) => {
    let taxAmount = 0;

    // 1. Calculate based on Charge Type
    if (tax.charge_type === 'On Net Total') {
      taxAmount = (itemTotal * (tax.rate || 0)) / 100;
    } else if (tax.charge_type === 'On Previous Row Amount') {
      // Logic for tiered taxes (like Cess on GST)
      const prevTax = deal.doc.taxes[deal.doc.taxes.indexOf(tax) - 1];
      taxAmount = ((prevTax?.tax_amount || 0) * (tax.rate || 0)) / 100;
    } else if (tax.charge_type === 'Actual') {
      taxAmount = tax.tax_amount || 0; // Manual entry
    } else if (tax.charge_type === 'On Previous Row Total') {
      taxAmount = (cumulativeTotal * (tax.rate || 0)) / 100;
    }

    // 2. Update the row values
    tax.tax_amount = taxAmount;
    cumulativeTotal += taxAmount;
    tax.total = cumulativeTotal; // This is the running total including this tax
  });

  // 3. Update main Quotation totals
  deal.doc.total_taxes_and_charges = deal.doc.taxes.reduce((sum, t) => sum + (t.tax_amount || 0), 0);
  deal.doc.grand_total = itemTotal + deal.doc.total_taxes_and_charges;
}
const printQuotation = (printFormat = 'Standard') => {
  const baseUrl = window.location.origin;
  const doctype = 'Quotation';
  const docname = deal.doc.name; // Ensure the doc is saved first!
  
  if (!docname) {
    console.error("Save the Quotation before printing.");
    return;
  }

  // Construct the Frappe Print URL
  const printUrl = `${baseUrl}/printview?doctype=${doctype}&name=${docname}&format=${printFormat}&no_letterhead=0`;
  
  // Open in a new tab
  window.open(printUrl, '_blank');
};
const tabs = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_fields_layout',
  cache: ['QuickEntry', 'Quotation'],
  params: { doctype: 'Quotation', type: 'Quick Entry' },
  auto: true,
  onSuccess: () => {
    // 🔥 Set defaults ONLY after the layout is ready
    const today = new Date().toISOString().split('T')[0];
    
    // We use Object.assign so we don't destroy the existing deal.doc object
      // ✅ Only set defaults for NEW quotations, not existing ones
  if (!props.quotation || Object.keys(props.quotation).length === 0) {
    Object.assign(deal.doc, {
      naming_series: 'SAL-QTN-.YYYY.-',
      transaction_date: today, // Check if your fieldname is 'date' or 'transaction_date'
      order_type: "Sales",
      quotation_to: "Customer",
      crm_deal: props.doc // Map the Deal ID from props
    });
  }
    if (props.doc && data) {
  data.forEach((tab) => {
    tab.sections.forEach((section) => {
      section.columns.forEach((column) => {
        column.fields.forEach((field) => {

          if (field.fieldname === 'party_name') {

            console.log("Filtering party_name field...");
            console.log("CRM Deal:", props.doc.name);

            field.get_query = () => {

              const doctype = deal.doc.quotation_to || "Customer";

              console.log("Dynamic Link Doctype:", doctype);

              return {
                doctype: doctype,
                filters: {
                  crm_deal: props.doc.name
                }
              };
            };

          }

        });
      });
    });
  });
}
  },
  transform: (_tabs) => {
    hasOrganizationSections.value = false
    return _tabs.forEach((tab) => {
      tab.sections.forEach((section) => {
        section.columns.forEach((column) => {
  //         if (
  //           ['organization_section', 'organization_details_section'].includes(
  //             section.name,
  //           )
  //         ) {
  //           hasOrganizationSections.value = true
  //         } else if (
  //           ['contact_section', 'contact_details_section'].includes(
  //             section.name,
  //           )
  //         ) {
  //           hasContactSections.value = true
  //         }
          column.fields.forEach((field) => {
  //           if (field.fieldname == 'status') {
  //             field.fieldtype = 'Select'
  //             field.options = dealStatuses.value
  //             field.prefix = getDealStatus(deal.doc.status).color
  //           }

            if (field.fieldtype === 'Table') {
              if (!props.quotation || Object.keys(props.quotation).length === 0) {

                deal.doc[field.fieldname] = []
              }
            }  
          })
        })
      })
    })
  },
})

// const dealStatuses = computed(() => {
//   let statuses = statusOptions('deal')
//   if (!deal.doc.status) {
//     deal.doc.status = statuses[0].value
//   }
//   return statuses
// })

async function createDeal() {

  await triggerOnBeforeCreate?.()

  createResource({
    url: 'merabt_crm.portal_api.api.create_new_doc',
    params: { args: deal.doc, doctype: 'Quotation' },
    auto: true,
    validate() {
      error.value = null
   
      isDealCreating.value = true
    },
    onSuccess(name) {
      capture('gamma_proposal_created')
      isDealCreating.value = false
      show.value = false
      router.push({ name: 'Quotation', params: { quotationId: name } })
    },
    onError(err) {
      isDealCreating.value = false
      console.log(err)
      if (!err.messages) {
        error.value = err.message
        return
      }
      error.value = err.messages.join('\n')
    },
  })
}

function openQuickEntryModal() {
  showQuickEntryModal.value = true
  quickEntryProps.value = { doctype: 'Quotation' }
  nextTick(() => (show.value = false))
}
// Replace your onMounted quotation loading with this watcher
// Replace your existing props.quotation watcher with this
watch(
  () => props.doc,
  async (docName) => {
    if (docName) {
      console.log('🔄 Fetching quotation doc:', docName)
      try {
        const result = await createResource({
          url: 'frappe.client.get',
          params: { doctype: 'Quotation', name: docName },
        }).submit()

        console.log('✅ Fetched doc:', result.name, '| docstatus:', result.docstatus)
        Object.assign(deal.doc, result)
      } catch (err) {
        console.error('❌ Failed to fetch quotation:', err)
      }
    }
  },
  { immediate: true }
)
onMounted(() => {

  // deal.doc = { naming_series: 'SAL-QTN-.YYYY.-' }
  // deal.doc.order_type = "Sales"
  // deal.doc.quotation_to = "Customer"
  // 🔥 Mapping the Deal ID
  if (!props.doc) {
    deal.doc.order_type = "Sales"
    deal.doc.quotation_to = "Customer"
    // This assigns the Deal ID to the 'crm_deal' field automatically
    // deal.doc.crm_deal = props.doc 
  }

  // If there are other defaults passed in
  if (props.defaults) {
    Object.assign(deal.doc, props.defaults)
  }
  // Object.assign(deal.doc, props.defaults)

  // if (!deal.doc.owner) {
  //   deal.doc.deal_owner = getUser().name
  // }
  // if (!deal.doc.status && dealStatuses.value[0].value) {
  //   deal.doc.status = dealStatuses.value[0].value
  // }
})
</script>
