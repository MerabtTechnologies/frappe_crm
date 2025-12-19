<!-- <template>
  <div
    class="my-3 flex items-center justify-between text-lg font-medium sm:mb-4 sm:mt-8"
  >
    <div class="flex h-8 items-center text-xl font-semibold text-ink-gray-8">
      {{ __('Data') }}
      <Badge
        v-if="document.isDirty"
        class="ml-3"
        :label="'Not Saved'"
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
        :tooltip="__('Edit fields layout')"
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
        @click="() => {console.log('Submit clicked', document);
          console.log('Document is dirty:', document.isDirty);
          console.log('Submitable or not:', document.doc.hasOwnProperty('amended_from'));
          showConfirm()
        }"
      />
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
      console.log('Submission cancelled Data Fields.vue')
      showConfirmDialogBox = false
    }"
  />
</template>

<script setup>
import EditIcon from '@/components/Icons/EditIcon.vue'
import DataFieldsModal from '@/components/Modals/DataFieldsModal.vue'
import FieldLayout from '@/components/FieldLayout/FieldLayout.vue'
import { Badge, createResource } from 'frappe-ui'
import LoadingIndicator from '@/components/Icons/LoadingIndicator.vue'
import { usersStore } from '@/stores/users'
import { useDocument } from '@/data/document'
import { isMobileView } from '@/composables/settings'
import { ref, watch, getCurrentInstance } from 'vue'
import ConfirmDialogBox from '@/components/ConfirmDialogBox.vue'
import Button from 'frappe-ui/src/components/Button/Button.vue'

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

const tabs = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_fields_layout',
  cache: ['DataFields', props.doctype],
  params: { doctype: props.doctype, type: 'Data Fields' },
  auto: true,
})

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
  if (document.doc.docstatus === 1){
    cancelSubmission()
  } else {
    confirmSubmission()     
  }
}
function cancelSubmission(){
  showConfirmDialogBox.value = false
  document.doc.docstatus = 2
  document.save.submit()
  console.log("Document Cancelled");
}
function confirmSubmission(){
  showConfirmDialogBox.value = false
  document.doc.docstatus = 1
  document.save.submit()
  console.log("Document Submitted");
}
function showConfirm(){
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
</script> -->



<template>
  <div
    class="my-3 flex items-center justify-between text-lg font-medium sm:mb-4 sm:mt-8"
  >
    <div class="flex h-8 items-center text-xl font-semibold text-ink-gray-8">
      {{ __('Data') }}
      <Badge
        v-if="document.isDirty"
        class="ml-3"
        :label="'Not Saved'"
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
        :tooltip="__('Edit fields layout')"
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
        @click="() => {console.log('Submit clicked', document);
          console.log('Document is dirty:', document.isDirty);
          console.log('Submitable or not:', document.doc.hasOwnProperty('amended_from'));
          showConfirm()
        }"
      />
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
      console.log('Submission cancelled Data Fields.vue')
      showConfirmDialogBox = false
    }"
  />

</template>

<script setup>
import EditIcon from '@/components/Icons/EditIcon.vue'
import DataFieldsModal from '@/components/Modals/DataFieldsModal.vue'
import FieldLayout from '@/components/FieldLayout/FieldLayout.vue'
import { Badge, createResource } from 'frappe-ui'
import { toast } from 'frappe-ui'
import LoadingIndicator from '@/components/Icons/LoadingIndicator.vue'
import { usersStore } from '@/stores/users'
import { useDocument } from '@/data/document'
import { isMobileView } from '@/composables/settings'
import { ref, watch, getCurrentInstance } from 'vue'
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


const tabs = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_fields_layout',
  cache: ['DataFields', props.doctype],
  params: { doctype: props.doctype, type: 'Data Fields' },
  auto: true,
})

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
  console.log("Document Cancelled");
}

function confirmSubmission() {
  showConfirmDialogBox.value = false
  document.doc.docstatus = 1
  document.save.submit()
  console.log("Document Submitted");
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
