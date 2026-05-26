<template>
  <div
    class="my-3 flex items-center justify-between text-lg font-medium sm:mb-4 sm:mt-8"
  >
    <div class="flex h-8 items-center text-xl font-semibold text-ink-gray-8">
      {{ __('Data') }}
      <Badge
        v-if="document.isDirty"
        class="ml-3"
        :label="__('Not Saved')"
        theme="orange"
      />
      <Badge
        v-if="document.doc.hasOwnProperty('amended_from')"
        class="ml-3"
        :label="document.doc.docstatus === 0 ? 'Draft' : (document.doc.docstatus === 1 ? 'Document Submitted' : 'Document Cancelled')"
        :theme="document.doc.docstatus === 0 ? 'blue' : (document.doc.docstatus === 2 ? 'gray' : 'blue')"
      />
    </div>
    <div class="flex gap-1">
      <Button
        v-if="isManager() && !isMobileView"
        :tooltip="__('Edit Fields Layout')"
        :icon="EditIcon"
        @click="showDataFieldsModal = true"
      />
      <Button
        label="Save"
        :disabled="!document.isDirty"
        variant="solid"
        :loading="document.save.loading"
        @click="saveChanges"
      />
      <Button
        v-if="document.doc.hasOwnProperty('amended_from') && document.doc.docstatus !== 2 && !document.isDirty"
        :label="document.doc.docstatus === 1 ? __('Cancel') : __('Submit')"
        variant="solid"
        :loading="document.save.loading"
        @click="() => {
          // console.log('Submit clicked', document);
          // console.log('Document is dirty:', document.isDirty);
          // console.log('Submitable or not:', document.doc.hasOwnProperty('amended_from'));
          showConfirm()
        }"
      />
      <!-- Amend Button -->
        <button
          v-if="document.doc.hasOwnProperty('amended_from') && document.doc.docstatus === 2 &&hasAmendedChild.data === 0"
          :disabled="amendResource.loading"
          @click="showAmendConfirm = true"
          style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 0 12px;
            height: 28px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            border: 1px solid #d97706;
            background: #fffbeb;
            color: #92400e;
            transition: background 0.15s, box-shadow 0.15s;
          "
          onmouseover="this.style.background='#fef3c7'; this.style.boxShadow='0 0 0 2px #fcd34d'"
          onmouseout="this.style.background='#fffbeb'; this.style.boxShadow='none'"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086ZM11.189 6.25 9.75 4.81 3.19 11.371a.25.25 0 0 0-.063.108l-.587 2.054 2.054-.587a.25.25 0 0 0 .108-.063L11.19 6.25Z" fill="#92400e"/>
          </svg>
          <span v-if="amendResource.loading">Amending...</span>
          <span v-else>Amend</span>
        </button>
    </div>
  </div>
  <div
    v-if="document.get.loading"
    class="flex flex-1 flex-col items-center justify-center gap-3 text-xl font-medium text-ink-gray-6"
  >
    <LoadingIndicator class="h-6 w-6" />
    <span>{{ __('Loading...') }}</span>
  </div>
  <div v-else class="pb-8">
    <FieldLayout
      v-if="tabs.data"
      :tabs="tabs.data"
      :data="document.doc"
      :doctype="doctype"
    />
  </div>
  <DataFieldsModal
    v-if="showDataFieldsModal"
    v-model="showDataFieldsModal"
    :doctype="doctype"
    @reload="
      () => {
        tabs.reload()
        document.reload()
      }
    "
  />
  <ConfirmDialogBox
    v-if="showConfirmDialogBox"
    v-model="showConfirmDialogBox"
    :doctype="doctype"
    :docname="docname"
    :title="(document.doc.docstatus === 1 ? 'Cancel' : 'Submit') + ' ' + docname + '?'"
    :message="'Are you sure you want to ' + (document.doc.docstatus === 1 ? 'cancel' : 'submit') + ' this ' + docname + '?'"
    :confirmText="(document.doc.docstatus === 1 ? 'Cancel' : 'Submit')"
    :confirmIcon="(document.doc.docstatus === 1 ? 'trash' : 'check')"
    :confirmButtonColor="(document.doc.docstatus === 1 ? 'gray' : 'green')"
    name="Employee Task Assignments"
    @confirm="() => submitChanges()"
    @cancel="()=> {
      // console.log('Submission cancelled Data Fields.vue')
      showConfirmDialogBox = false
    }"
    />
  <ConfirmDialogBox
    v-if=" showAmendConfirm && document.doc.hasOwnProperty('amended_from') && document.doc.docstatus === 2 && hasAmendedChild.data === 0"
    v-model="showAmendConfirm"
    :doctype="doctype"
    :docname="docname"
    :title="'Amend ' + docname + '?'"
    :message="'This will create a new draft copy of ' + docname + ' for editing.'"
    :confirmText="__('Amend')"
    confirmIcon="edit"
    confirmButtonColor="blue"
    name="Employee Task Assignments"
    @confirm="amendDocument"
    @cancel="showAmendConfirm = false"
  />

</template>

<script setup>
import EditIcon from '@/components/Icons/EditIcon.vue'
import DataFieldsModal from '@/components/Modals/DataFieldsModal.vue'
import FieldLayout from '@/components/FieldLayout/FieldLayout.vue'
import { Badge, createResource, toast } from 'frappe-ui'
import LoadingIndicator from '@/components/Icons/LoadingIndicator.vue'
import { usersStore } from '@/stores/users'
import { useDocument } from '@/data/document'
import { isMobileView } from '@/composables/settings'
import { ref, watch, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialogBox from '@/components/ConfirmDialogBox.vue'
const props = defineProps({
  doctype: {
    type: String,
    required: true,
  },
  docname: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['beforeSave', 'afterSave'])

const { isManager } = usersStore()

const instance = getCurrentInstance()
const attrs = instance?.vnode?.props ?? {}

const showDataFieldsModal = ref(false)

const { document } = useDocument(props.doctype, props.docname)
const { document: newDocument } = useDocument(props.doctype)
const showConfirmDialogBox = ref(false)
const showAmendConfirm = ref(false)       // ← new
const router = useRouter()
const isSaving = ref(false) // Flag to prevent watch during save
// Check if this doc has already been amended (a child exists with amended_from = this docname)
const hasAmendedChild = createResource({
  url: 'frappe.client.get_count',
  params: {
    doctype: props.doctype,
    filters: { amended_from: props.docname },
  },
  // auto: true,
  // 🔥 FIX: Only run automatically if the document supports amending
  auto: document.doc.hasOwnProperty('amended_from'),
})

const tabs = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_fields_layout',
  cache: ['DataFields', props.doctype],
  params: { doctype: props.doctype, type: 'Data Fields' },
  auto: true,
})
// ── Amend resource ──────────────────────────────────────────────
const amendResource = createResource({
  url: 'frappe.client.insert',
  onSuccess(newDoc) {
   
    toast.success(__(`New draft ${newDoc.name} created from ${props.docname}`))
    //  console.log('Amended doc:', newDoc)
    // Navigate to the new amended doc
    router.push({
          name: 'Quotation',
          params: { quotationId: newDoc.name },
        })
    },
  onError(err) {
    toast.error(__(`${err.message || 'Something went wrong'}`))
  },
})

// function amendDocument() {
//   showAmendConfirm.value = false

//   // Build a fresh draft copy, stripping submission-related fields
//   const docCopy = { ...document.doc }

//   // Fields to reset for the amended draft
//   delete docCopy.name
//   delete docCopy.creation
//   delete docCopy.modified
//   delete docCopy.modified_by
//   delete docCopy.owner


//   docCopy.docstatus = 0
//   docCopy.amended_from = props.docname
//   console.log('Data: ', newDocument);

//   newDocument.doc = { doctype: props.doctype, ...docCopy } 

  
//   // newDocument.doc.save.submit()
//   amendResource.submit({ doc: newDocument.doc})

//   // amendResource.submit({ doc: { doctype: props.doctype, ...docCopy } })
// }

function amendDocument() {
  showAmendConfirm.value = false;
  const docCopy = { ...document.doc };

  // 1. Clean the Parent
  delete docCopy.name;
  delete docCopy.creation;
  delete docCopy.modified;
  // ... rest of your deletes

  // 2. IMPORTANT: Clean the Child Table (Items)
  if (docCopy.items) {
    docCopy.items = docCopy.items.map(item => {
      const newItem = { ...item };
      delete newItem.name; // This prevents the DuplicateEntryError
      return newItem;
    });
  }

  docCopy.docstatus = 0;
  docCopy.amended_from = props.docname;
  
  amendResource.submit({ doc: { doctype: props.doctype, ...docCopy } });
}
// ───────────────────────────────────────────────────────────────
// function saveChanges() {
//   if (!document.isDirty) return

//   const updatedDoc = { ...document.doc }
//   const oldDoc = { ...document.originalDoc }

//   const changes = Object.keys(updatedDoc).reduce((acc, key) => {
//     if (JSON.stringify(updatedDoc[key]) !== JSON.stringify(oldDoc[key])) {
//       acc[key] = updatedDoc[key]
//     }
//     return acc
//   }, {})

//   const hasListener = attrs['onBeforeSave'] !== undefined

//   if (hasListener) {
//     emit('beforeSave', changes)
//   } else {
//     document.save.submit(null, {
//       onSuccess: () => emit('afterSave', changes),
//     })
//   }
//   document.save.submit(null, {
//     onSuccess: () => {
//       // CRITICAL: Reload the document to get server-calculated values
//       document.reload() 
//       emit('afterSave', changes)
//       toast.success(__('Saved successfully'))
//     },
//   })
// }

// 1. Resource to fetch Item details with logging
const itemDetailsResource = createResource({
  url: 'frappe.client.get_value',
  onBeforeSubmit() {
    // console.log('--- [Item Fetch] Starting to fetch item data from server ---');
  },
  onSuccess(data) {
    // console.log('--- [Item Fetch] Success! Received data:', data);
  },
  onError(err) {
    // console.error('--- [Item Fetch] Error fetching item:', err);
  }
})

// 2. Updated saveChanges function
// function saveChanges() {
//   if (!document.isDirty) {
//     console.log('--- [Save] No changes detected. Skipping save. ---');
//     return;
//   }

//   console.log('--- [Save] Initiating document save... ---');

//   isSaving.value = true; // Disable watch during save

//   const updatedDoc = { ...document.doc };
//   const oldDoc = { ...document.originalDoc };

//   const changes = Object.keys(updatedDoc).reduce((acc, key) => {
//     if (JSON.stringify(updatedDoc[key]) !== JSON.stringify(oldDoc[key])) {
//       acc[key] = updatedDoc[key];
//     }
//     return acc;
//   }, {});

//   document.save.submit(null, {
//     onSuccess: async () => {
//       console.log('--- [Save] Document saved successfully to database. ---');

//       document.reload(); 
//       emit('afterSave', changes);
//       toast.success(__('Saved successfully'));
//       isSaving.value = false; // Re-enable watch after save
//     },
//     onError: () => {
//       isSaving.value = false; // Re-enable watch on error
//     }
//   });
// }
function saveChanges() {
  if (!document.isDirty) {
    // console.log('--- [Save] No changes detected. ---');
    return;
  }

  // console.log('--- [Save] Initiating document save... ---');

  // 1. Lock the watchers immediately
  isSaving.value = true; 

  document.save.submit(null, {
    onSuccess: async (savedDoc) => {
      // console.log('--- [Save] Success ---');
      
      try {
        // 2. Clear the dirty flag manually so the badge disappears
        document.isDirty = false;

        // 3. Await the reload so the frontend syncs with server-side 
        // calculations (like Taxes and Totals)
        await document.reload();

        // 4. Emit and Notify
        emit('afterSave', savedDoc);
        toast.success(__('Saved successfully'));

      } catch (err) {
        // console.error('Error during post-save reload:', err);
      } finally {
        // 5. IMPORTANT: Wait for the DOM and Vue state to settle 
        // before allowing the watcher to run again.
        setTimeout(() => {
          isSaving.value = false;
          // console.log('--- Watchers re-enabled ---');
        }, 500);
      }
    },
    onError: () => {
      isSaving.value = false;
      toast.error(__('Save failed'));
    }
  });
}
// 3. Logic with detailed logs for the Child Table
async function handleAutoItemAddition() {
  const targetItemCode = 'YOUR_ITEM_CODE_HERE'; // Replace with your actual Item Code
  
  // console.log(`--- [Logic] Checking if ${targetItemCode} already exists in items table... ---`);

  // Check if item already exists
  const exists = document.doc.items.find(row => row.item_code === targetItemCode);
  
  if (exists) {
    // console.warn(`--- [Logic] Item ${targetItemCode} already exists. Aborting to prevent duplicates. ---`);
    return;
  }

  try {
    // console.log(`--- [Logic] Item not found. Fetching details for: ${targetItemCode} ---`);
    
    const itemData = await itemDetailsResource.submit({
      doctype: 'Item',
      filters: { name: targetItemCode },
      fieldname: ['item_name', 'description', 'standard_rate', 'stock_uom']
    });

    if (itemData) {
      // console.log('--- [Logic] Preparing to push new row to child table... ---');
      
      const newRow = { // New item to be added without index
        doctype: 'Quotation Item',
        item_code: targetItemCode,
        item_name: itemData.item_name,
        description: itemData.description,
        qty: 1,
        rate: itemData.standard_rate || 0,
        uom: itemData.stock_uom,
        amount: (itemData.standard_rate || 0) * 1,
      };
      // Ensure 'name' is NOT present so the server generates a new one
      delete newRow.name;
      document.doc.items.push(newRow);
      
      // console.log('--- [Logic] New row added to document.doc.items:', newRow);
      
      // Force UI to show "Save" button again
      document.isDirty = true;
      // console.log('--- [Logic] document.isDirty set to true. User can now save the new item. ---');
    } else {
      // console.error('--- [Logic] No data returned for this Item Code. Check if the Item exists in Item Master. ---');
    }
  } catch (error) {
    // console.error('--- [Logic] Critical Error in handleAutoItemAddition:', error);
  }
}

function submitChanges() {
  // if (!document.isDirty) return
  if (document.doc.docstatus === 1) {
    cancelSubmission()
  } else {
    confirmSubmission()
  }
}

function cancelSubmission() {
  showConfirmDialogBox.value = false
  isSaving.value = true;
  document.doc.docstatus = 2
  document.save.submit()
  isSaving.value = false;
  // console.log("Document Cancelled");
}

function confirmSubmission() {
  showConfirmDialogBox.value = false
  isSaving.value = true;
  document.doc.docstatus = 1
  document.save.submit()
  isSaving.value = false;
  // console.log("Document Submitted");
}

function showConfirm() {
  showConfirmDialogBox.value = true
}

// watch(
//   () => document.doc,
//   (newValue, oldValue) => {
//     if (!oldValue) return
//     if (newValue && oldValue) {
//       const isDirty =
//         JSON.stringify(newValue) !== JSON.stringify(document.originalDoc)
//       document.isDirty = isDirty
//       if (isDirty) {
//         document.save.loading = false
//       }
//     }
//   },
//   { deep: true },
// )
// 1. Watch the items array for changes in item_code
// watch(
//   () => document.doc.items,
//   (newItems) => {
//     if (!newItems || isSaving.value || document.doc.docstatus !== 0) return;

//     // 🔥 FIX 1: FORCE SEQUENTIAL INDEXING IMMEDIATELY
//     // This stops "idx: 28" from happening. It forces 1, 2, 3...
//     newItems.forEach((item, index) => {
//       item.idx = index + 1;
//     });

//     newItems.forEach(async (row) => {
//       // Trigger: Item is selected, but not yet processed
//       if (row.item_code && !row.__item_fetched) {
//         try {
//           const itemData = await createResource({
//             url: 'frappe.client.get',
//             params: { doctype: 'Item', name: row.item_code }
//           }).submit();

//           const priceData = await createResource({
//             url: 'frappe.client.get_value',
//             params: {
//               doctype: 'Item Price',
//               filters: { 
//                 item_code: row.item_code, 
//                 price_list: document.doc.selling_price_list || 'Standard Selling' 
//               },
//               fieldname: 'price_list_rate'
//             }
//           }).submit();

//           if (itemData) {
//             // Store the correct idx before the loop starts
//             const correctIdx = row.idx;

//             for (const key in row) {
//               // 🔥 FIX 2: PROTECT 'name' AND 'idx'
//               // If you don't skip 'idx', itemData might overwrite your row.idx 
//               // with a value from the Item Master database.
//               if (key === 'name' || key === 'idx' || key.startsWith('__')) continue;
              
//               if (key === 'custom__is_recurring_item') {
//                 row[key] = itemData.custom_is_recurring_item;
//                 continue;
//               }

//               if (key === 'rate') {
//                 row.rate = priceData?.price_list_rate || itemData.standard_rate || 0;
//                 continue;
//               }
              
//               if (key === 'uom') {
//                 row.uom = itemData.stock_uom || row.uom;
//                 continue;
//               }

//               if (itemData[key] !== undefined) {
//                 row[key] = itemData[key];
//               }
//             }

//             // Ensure idx stays correct after the loop
//             row.idx = correctIdx; 
            
//             row.qty = row.qty || 1;
//             row.amount = (row.rate || 0) * (row.qty || 0);
//             row.__item_fetched = true; 
//             document.isDirty = true;
//           }
//         } catch (error) {
//           console.error("Dynamic Fetch Failed:", error);
//         }
//       }

//       // Live Calculation
//       if (!isSaving.value) {
//         row.amount = (parseFloat(row.qty) || 0) * (parseFloat(row.rate) || 0);
//       }
//     });
//   },
//   { deep: true }
// );
watch(
  () => document.doc.items,
  (newItems) => {
    // 🛑 GUARD 1: If we are saving, or if the document is NOT a Draft (0), STOP.
    // This prevents the "Not Saved" badge after Submit (docstatus 1).
    if (!newItems || isSaving.value || document.doc.docstatus !== 0) return;

    newItems.forEach(async (row, index) => {
      // 1. Force Index Sequence (Silent - don't mark dirty just for this)
      const correctIdx = index + 1;
      if (row.idx !== correctIdx) {
        row.idx = correctIdx;
      }

      // 2. Fetch Logic (Only for newly added items)
      if (row.item_code && !row.__item_fetched) {
        try {
          const itemData = await createResource({
            url: 'frappe.client.get',
            params: { doctype: 'Item', name: row.item_code }
          }).submit();

          const priceData = await createResource({
            url: 'frappe.client.get_value',
            params: {
              doctype: 'Item Price',
              filters: { 
                item_code: row.item_code, 
                price_list: document.doc.selling_price_list || 'Standard Selling' 
              },
              fieldname: 'price_list_rate'
            }
          }).submit();

          if (itemData) {
            for (const key in row) {
              if (key === 'name' || key === 'idx' || key.startsWith('__')) continue;
              
              if (key === 'custom__is_recurring_item') {
                row[key] = itemData.custom_is_recurring_item;
                continue;
              }
              if (key === 'rate') {
                row.rate = priceData?.price_list_rate || itemData.standard_rate || 0;
                continue;
              }
              if (key === 'uom') {
                row.uom = itemData.stock_uom || row.uom;
                continue;
              }
              if (itemData[key] !== undefined) {
                row[key] = itemData[key];
              }
            }

            row.qty = row.qty || 1;
            row.__item_fetched = true;
            document.isDirty = true; // Only mark dirty when we actually fetch new data
          }
        } catch (error) {
          // console.error("Dynamic Fetch Failed:", error);
        }
      }

      // 3. Calculation Logic (The "Anti-Badge" Guard)
      const q = parseFloat(row.qty) || 0;
      const r = parseFloat(row.rate) || 0;
      const calculatedAmount = q * r;

      // 🔥 FIX: Only update amount and mark dirty IF the value actually changed.
      // This stops the infinite "Not Saved" loop.
      if (Math.abs((row.amount || 0) - calculatedAmount) > 0.001) {
        row.amount = calculatedAmount;
        document.isDirty = true;
      }
    });
  },
  { deep: true }
);
// Add this to your watchers
watch(
  () => document.doc,
  (newValue) => {
    if (!newValue || isSaving.value) return;

    // Compare current doc with the original one from the server
    const isDirty = JSON.stringify(newValue) !== JSON.stringify(document.originalDoc);
    
    // Update the resource state
    document.isDirty = isDirty;

    // If it's dirty, ensure the save button loading state is reset
    if (isDirty) {
      document.save.loading = false;
    }
  },
  { deep: true, immediate: true } // immediate: true is key for tab switching
);
</script>
