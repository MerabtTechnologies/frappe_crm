<template>
  <div class="flex h-full min-h-0 flex-col">
    <div
      class="flex shrink-0 items-center justify-between py-3 text-lg-medium sm:pb-4 sm:pt-8"
    >
      <div class="flex h-8 items-center text-xl font-semibold text-ink-gray-8">
        {{ __('Data') }}
        <Badge
          v-if="document.isDirty"
          class="ml-3"
          :label="__('Not Saved')"
          theme="amber"
        />
        <Badge
          v-if="supportsAmendment"
          class="ml-3"
          :label="
            document.doc.docstatus === 0
              ? 'Draft'
              : document.doc.docstatus === 1
                ? 'Document Submitted'
                : 'Document Cancelled'
          "
          :theme="
            document.doc.docstatus === 0
              ? 'blue'
              : document.doc.docstatus === 2
                ? 'gray'
                : 'blue'
          "
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
          :disabled="
            !document.isDirty ||
            document.enriching ||
            isSaving ||
            fetchingItems ||
            !permissions.data?.permissions?.write
          "
          variant="solid"
          :loading="document.save.loading || isSaving"
          @click="saveChanges"
        />
        <Button
          v-if="
            supportsAmendment &&
            document.doc.docstatus !== 2 &&
            !document.isDirty &&
            (document.doc.docstatus === 1
              ? permissions.data?.permissions?.cancel
              : permissions.data?.permissions?.submit)
          "
          :disabled="document.enriching || fetchingItems"
          :label="document.doc.docstatus === 1 ? __('Cancel') : __('Submit')"
          variant="solid"
          :loading="document.save.loading || isSaving"
          @click="
            () => {
              // console.log('Submit clicked', document);
              // console.log('Document is dirty:', document.isDirty);
              // console.log('Submitable or not:', supportsAmendment);
              showConfirm()
            }
          "
        />
        <!-- Amend Button -->
        <button
          v-if="
            supportsAmendment &&
            document.doc.docstatus === 2 &&
            hasAmendedChild.data === 0 &&
            permissions.data?.permissions?.amend
          "
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
            transition:
              background 0.15s,
              box-shadow 0.15s;
          "
          onmouseover="this.style.background='#fef3c7'; this.style.boxShadow='0 0 0 2px #fcd34d'"
          onmouseout="this.style.background='#fffbeb'; this.style.boxShadow='none'"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086ZM11.189 6.25 9.75 4.81 3.19 11.371a.25.25 0 0 0-.063.108l-.587 2.054 2.054-.587a.25.25 0 0 0 .108-.063L11.19 6.25Z"
              fill="#92400e"
            />
          </svg>
          <span v-if="amendResource.loading">Amending...</span>
          <span v-else>Amend</span>
        </button>
      </div>
    </div>
    <FadedScrollableDiv class="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div
        v-if="document.get.loading"
        class="flex flex-1 flex-col items-center justify-center gap-3 text-xl font-medium text-ink-gray-6"
      >
        <LoadingIndicator class="h-6 w-6" />
        <span>{{ __('Loading...') }}</span>
      </div>
      <div
        v-else
        class="pb-8"
        :class="{ 'opacity-60': document.enriching }"
        :inert="document.enriching"
      >
        <FieldLayout
          v-if="tabs.data"
          v-model:tabIndex="fieldLayoutTabIndex"
          v-model:tabName="fieldLayoutTabName"
          :tabs="tabs.data"
          :data="document.doc"
          :doctype="doctype"
        />
      </div>
    </FadedScrollableDiv>
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
    :title="
      (document.doc.docstatus === 1 ? 'Cancel' : 'Submit') + ' ' + docname + '?'
    "
    :message="
      'Are you sure you want to ' +
      (document.doc.docstatus === 1 ? 'cancel' : 'submit') +
      ' this ' +
      docname +
      '?'
    "
    :confirmText="document.doc.docstatus === 1 ? 'Cancel' : 'Submit'"
    :confirmIcon="document.doc.docstatus === 1 ? 'trash' : 'check'"
    :confirmButtonColor="document.doc.docstatus === 1 ? 'gray' : 'green'"
    name="Employee Task Assignments"
    @confirm="() => submitChanges()"
    @cancel="
      () => {
        // console.log('Submission cancelled Data Fields.vue')
        showConfirmDialogBox = false
      }
    "
  />
  <ConfirmDialogBox
    v-if="
      showAmendConfirm &&
      supportsAmendment &&
      document.doc.docstatus === 2 &&
      hasAmendedChild.data === 0
    "
    v-model="showAmendConfirm"
    :doctype="doctype"
    :docname="docname"
    :title="'Amend ' + docname + '?'"
    :message="
      'This will create a new draft copy of ' + docname + ' for editing.'
    "
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
import FadedScrollableDiv from '@/components/FadedScrollableDiv.vue'
import LoadingIndicator from '@/components/Icons/LoadingIndicator.vue'
import { usersStore } from '@/stores/users'
import { useDocument } from '@/data/document'
import { provideEnrichedFieldnames } from '@/data/enrichedFields'
import { isMobileView } from '@/composables/settings'
import { ref, watch, getCurrentInstance, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useItemCalculations } from '@/composables/useItemCalculations'
import ConfirmDialogBox from '@/components/ConfirmDialogBox.vue'

const props = defineProps({
  doctype: { type: String, required: true },
  docname: { type: String, required: true },
})

const emit = defineEmits(['beforeSave', 'afterSave'])
const fieldLayoutTabIndex = defineModel('fieldLayoutTabIndex', {
  type: Number,
  default: 0,
})
const fieldLayoutTabName = defineModel('fieldLayoutTabName', {
  type: String,
  default: '',
})

const { isManager } = usersStore()

const instance = getCurrentInstance()
const attrs = instance?.vnode?.props ?? {}

const showDataFieldsModal = ref(false)

const { document, permissions } = useDocument(props.doctype, props.docname)
const supportsAmendment = computed(() =>
  Object.prototype.hasOwnProperty.call(document.doc || {}, 'amended_from'),
)
const showConfirmDialogBox = ref(false)
const showAmendConfirm = ref(false) // ← new
const router = useRouter()
const route = useRoute()
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
  auto: false,
})

watch(
  supportsAmendment,
  (supported) => {
    if (supported) hasAmendedChild.fetch()
  },
  { immediate: true },
)

// For the enriched-field icon on each field below.
provideEnrichedFieldnames(props.doctype, props.docname)

const fieldLayoutTabStorageKey = computed(
  () => `fieldLayoutTab:${props.doctype}:${props.docname}`,
)

watch(
  fieldLayoutTabStorageKey,
  (key) => {
    const tabName = sessionStorage.getItem(key)
    if (tabName && fieldLayoutTabName.value !== tabName) {
      fieldLayoutTabName.value = tabName
    }
  },
  { immediate: true },
)

watch(fieldLayoutTabName, (tabName) => {
  if (tabName) {
    sessionStorage.setItem(fieldLayoutTabStorageKey.value, tabName)
  } else {
    sessionStorage.removeItem(fieldLayoutTabStorageKey.value)
  }
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
    const params = Object.fromEntries(
      Object.entries(route.params).map(([key, value]) => [
        key,
        value === props.docname ? newDoc.name : value,
      ]),
    )
    router.push({
      name: route.name,
      params,
      query: route.query,
      hash: route.hash,
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
  if (
    !permissions.data?.permissions?.amend ||
    document.doc?.docstatus !== 2 ||
    amendResource.loading
  )
    return
  showAmendConfirm.value = false
  const docCopy = JSON.parse(JSON.stringify(document.doc))
  const reset = (doc) => {
    for (const field of [
      'name',
      'creation',
      'modified',
      'modified_by',
      'owner',
      'parent',
      'parenttype',
      'parentfield',
      '_assign',
      '_comments',
      '_liked_by',
      '_seen',
    ]) {
      delete doc[field]
    }
    Object.keys(doc)
      .filter((key) => key.startsWith('__'))
      .forEach((key) => delete doc[key])
    doc.docstatus = 0
    Object.values(doc)
      .filter(Array.isArray)
      .forEach((rows) => {
        rows.forEach((row) => {
          if (row?.doctype) reset(row)
        })
      })
  }
  reset(docCopy)
  docCopy.amended_from = props.docname
  amendResource.submit({ doc: { ...docCopy, doctype: props.doctype } })
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
  },
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
async function saveChanges() {
  if (
    !document.isDirty ||
    document.enriching ||
    isSaving.value ||
    document.save.loading ||
    fetchingItems.value ||
    !permissions.data?.permissions?.write
  )
    return
  const changes = Object.fromEntries(
    Object.entries(document.doc || {}).filter(
      ([key, value]) =>
        JSON.stringify(value) !== JSON.stringify(document.originalDoc?.[key]),
    ),
  )
  if (attrs.onBeforeSave !== undefined) {
    emit('beforeSave', changes)
    return
  }
  isSaving.value = true
  try {
    await document.save.submit(null, {
      onSuccess: async () => {
        await document.reload()
        emit('afterSave', changes)
      },
    })
  } finally {
    isSaving.value = false
  }
}
// 3. Logic with detailed logs for the Child Table
async function handleAutoItemAddition() {
  const targetItemCode = 'YOUR_ITEM_CODE_HERE' // Replace with your actual Item Code

  // console.log(`--- [Logic] Checking if ${targetItemCode} already exists in items table... ---`);

  // Check if item already exists
  const exists = document.doc.items.find(
    (row) => row.item_code === targetItemCode,
  )

  if (exists) {
    // console.warn(`--- [Logic] Item ${targetItemCode} already exists. Aborting to prevent duplicates. ---`);
    return
  }

  try {
    // console.log(`--- [Logic] Item not found. Fetching details for: ${targetItemCode} ---`);

    const itemData = await itemDetailsResource.submit({
      doctype: 'Item',
      filters: { name: targetItemCode },
      fieldname: ['item_name', 'description', 'standard_rate', 'stock_uom'],
    })

    if (itemData) {
      // console.log('--- [Logic] Preparing to push new row to child table... ---');

      const newRow = {
        // New item to be added without index
        doctype: 'Quotation Item',
        item_code: targetItemCode,
        item_name: itemData.item_name,
        description: itemData.description,
        qty: 1,
        rate: itemData.standard_rate || 0,
        uom: itemData.stock_uom,
        amount: (itemData.standard_rate || 0) * 1,
      }
      // Ensure 'name' is NOT present so the server generates a new one
      delete newRow.name
      document.doc.items.push(newRow)

      // console.log('--- [Logic] New row added to document.doc.items:', newRow);

      // Force UI to show "Save" button again
      document.isDirty = true
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

async function updateSubmission(cancel) {
  if (
    document.enriching ||
    isSaving.value ||
    document.isDirty ||
    fetchingItems.value ||
    !permissions.data?.permissions?.[cancel ? 'cancel' : 'submit']
  )
    return
  showConfirmDialogBox.value = false
  isSaving.value = true
  try {
    await createResource({
      url: cancel ? 'frappe.client.cancel' : 'frappe.client.submit',
    }).submit(
      cancel
        ? { doctype: props.doctype, name: props.docname }
        : { doc: document.doc },
    )
    await document.reload()
    emit('afterSave', { docstatus: cancel ? 2 : 1 })
  } catch (error) {
    toast.error(
      error.messages?.[0] ||
        error.message ||
        __('Could not update document status'),
    )
  } finally {
    isSaving.value = false
  }
}

function cancelSubmission() {
  return updateSubmission(true)
}

function confirmSubmission() {
  return updateSubmission(false)
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
const { fetchingItems } = useItemCalculations(document, {
  isBlocked: () =>
    isSaving.value ||
    document.save.loading ||
    document.get.loading ||
    document.enriching ||
    document.doc?.docstatus !== 0 ||
    !permissions.data?.permissions?.write,
  async fetchItem(itemCode, priceList) {
    const [item, price] = await Promise.all([
      createResource({ url: 'frappe.client.get' }).submit({
        doctype: 'Item',
        name: itemCode,
      }),
      createResource({ url: 'frappe.client.get_value' }).submit({
        doctype: 'Item Price',
        filters: { item_code: itemCode, price_list: priceList },
        fieldname: 'price_list_rate',
      }),
    ])
    return { item, price }
  },
  onError: (error) =>
    toast.error(
      error.messages?.[0] ||
        error.message ||
        __('Could not fetch item details'),
    ),
})
</script>
