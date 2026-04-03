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
        v-if="document.doc.hasOwnProperty('amended_from') && document.doc.docstatus !== 2"
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
          v-if="document.doc.hasOwnProperty('amended_from') && document.doc.docstatus === 2"
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
    v-if="showAmendConfirm"
    v-model="showAmendConfirm"
    :doctype="doctype"
    :docname="docname"
    :title="'Amend ' + docname + '?'"
    message="This will create a new draft copy of this document for editing."
    confirmText="Amend"
    confirmIcon="edit"
    confirmButtonColor="orange"
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
const showConfirmDialogBox = ref(false)
const showAmendConfirm = ref(false)       // ← new
const router = useRouter()


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
     console.log('Amended doc:', newDoc)
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

function amendDocument() {
  showAmendConfirm.value = false

  // Build a fresh draft copy, stripping submission-related fields
  const docCopy = { ...document.doc }

  // Fields to reset for the amended draft
  delete docCopy.name
  delete docCopy.creation
  delete docCopy.modified
  delete docCopy.modified_by
  delete docCopy.owner

  docCopy.docstatus = 0
  docCopy.amended_from = props.docname
  
  amendResource.submit({ doc: { doctype: props.doctype, ...docCopy } })
}
// ───────────────────────────────────────────────────────────────
function saveChanges() {
  if (!document.isDirty) return

  const updatedDoc = { ...document.doc }
  const oldDoc = { ...document.originalDoc }

  const changes = Object.keys(updatedDoc).reduce((acc, key) => {
    if (JSON.stringify(updatedDoc[key]) !== JSON.stringify(oldDoc[key])) {
      acc[key] = updatedDoc[key]
    }
    return acc
  }, {})

  const hasListener = attrs['onBeforeSave'] !== undefined

  if (hasListener) {
    emit('beforeSave', changes)
  } else {
    document.save.submit(null, {
      onSuccess: () => emit('afterSave', changes),
    })
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
  document.doc.docstatus = 2
  document.save.submit()
  // console.log("Document Cancelled");
}

function confirmSubmission() {
  showConfirmDialogBox.value = false
  document.doc.docstatus = 1
  document.save.submit()
  // console.log("Document Submitted");
}

function showConfirm() {
  showConfirmDialogBox.value = true
}

watch(
  () => document.doc,
  (newValue, oldValue) => {
    if (!oldValue) return
    if (newValue && oldValue) {
      const isDirty =
        JSON.stringify(newValue) !== JSON.stringify(document.originalDoc)
      document.isDirty = isDirty
      if (isDirty) {
        document.save.loading = false
      }
    }
  },
  { deep: true },
)
</script>
