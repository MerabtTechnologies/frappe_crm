<template>
  <ProjectTaskModal
    v-model="showProjectTaskModal"
    v-model:reloadTasks="activities"
    :task="projectTask"
    :doctype="doctype"
    :doc="doc?.name"
    @after="redirect('project-tasks')"
  />
  <GammaModal
    v-model="showGammaProposalModal"
    v-model:reloadProposals="activities"
    :proposal="gammaProposal"
    :doctype="doctype"
    :doc="doc?.name"
    @after="redirect('gamma-proposal')"
  />
  <NoteModal
    v-model="showNoteModal"
    v-model:reloadNotes="activities"
    :note="note"
    :doctype="doctype"
    :doc="doc?.name"
    @after="redirect('notes')"
  />
  <CallLogModal
    v-if="showCallLogModal"
    v-model="showCallLogModal"
    :data="callLog"
    :referenceDoc="referenceDoc"
    :options="{ afterInsert: () => activities.reload() }"
  />
   <QuotationModal
    v-model="showQuotationModal"
    v-model:reloadQuotations="activities"
    :defaults="quotation"
    :doctype="doctype"
    @after="redirect('quotations')"
  />
</template>
<script setup>
import { useDoctypeModal } from '@/composables/doctypeModal'
import { useOnboarding, useTelemetry } from 'frappe-ui/frappe'
import { call } from 'frappe-ui'
import { ref } from 'vue'
import { dayjs } from 'frappe-ui'
import { useRoute, useRouter } from 'vue-router'
import ProjectTaskModal from '@/components/Modals/ProjectTaskModal.vue'
import GammaModal from '@/components/Modals/GammaModal.vue'
import QuotationModal from '@/components/Modals/QuotationModal.vue'

const props = defineProps({
  doctype: { type: String, default: '' },
  doc: { type: Object, default: () => ({}) },
})

const activities = defineModel({ type: Object })

const now = dayjs()

const { showModal } = useDoctypeModal()
const { updateOnboardingStep } = useOnboarding('frappecrm')
const { capture } = useTelemetry()

// Tasks
function showTask(task) {
  showModal({
    name: task?.name,
    doctype: 'CRM Task',
    title: 'Task',
    defaults: {
      reference_doctype: props.doctype,
      reference_docname: props.doc?.name,
      due_date: !task.due_date ? now.format('YYYY-MM-DD HH:mm:ss') : task.due_date,
    },
    callbacks: {
      afterInsert: (d) => afterDoctype(d, true),
      afterUpdate: afterDoctype,
    },
  })
}

async function deleteTask(name) {
  await call('frappe.client.delete', {
    doctype: 'CRM Task',
    name,
  })
  activities.value.reload()
}

function updateTaskStatus(status, task) {
  call('frappe.client.set_value', {
    doctype: 'CRM Task',
    name: task.name,
    fieldname: 'status',
    value: status,
  }).then(() => {
    activities.value.reload()
  })
}

// Project Tasks
const showProjectTaskModal = ref(false)
const projectTask = ref({})

function showProjectTask(t) {
  projectTask.value = t || {
    subject: '',
    description: '',
    assigned_to: '',
    due_date: '',
    priority: 'Low',
    status: 'Open',
  }
  showProjectTaskModal.value = true
}

// function gammaProposalModal() {
//   import('@/components/Modals/GammaModal.vue')
//     .then((module) => {
//       return module.default
//     })
//     .then((GammaModal) => {
//       defineComponent({
//         components: { GammaModal },
//         setup() {
//           return {}
//         },
//       })        
// }
const showGammaProposalModal = ref(false)
const gammaProposal = ref({})
function showGammaProposal(t) {
  gammaProposal.value = t || {
    title: '',
    description: '',
    customer: '',
    valid_till: '',
    status: 'Draft',
  }
  showGammaProposalModal.value = true
}
const showQuotationModal = ref(false)
const quotation = ref({})
function showQuotation(q) {
  const today = new Date().toISOString().split('T')[0]
  quotation.value = q || {
    title: '',
    description: '',
    customer: '',
    valid_till: '',
    status: 'Draft',
    naming_series: 'SAL-QTN-.YYYY.-',
    transaction_date: today, // Check if your fieldname is 'date' or 'transaction_date'
    order_type: 'Sales',
    quotation_to: 'Customer',
    crm_deal: props.doc.name

  }
  showQuotationModal.value = true
}
async function deleteProjectTask(name) {
  await call('frappe.client.delete', {
    doctype: 'Task',
    name,
  })
  activities.value.reload()
}

function updateProjectTaskStatus(status, task) {
  call('frappe.client.set_value', {
    doctype: 'Task',
    name: task.name,
    fieldname: 'status',
    value: status,
  }).then(() => {
    activities.value.reload()
  })
}
// function updateGammaProposalStatus(status, task) {
//   call('frappe.client.set_value', {
//     doctype: 'Gamma Proposal',
//     name: task.name,
//     fieldname: 'status',
//     value: status,
//   }).then(() => {
//     activities.value.reload()
//   })
// }

// Notes
function showNote(note) {
  showModal({
    name: note?.name,
    doctype: 'FCRM Note',
    title: 'Note',
    defaults: {
      reference_doctype: props.doctype,
      reference_docname: props.doc?.name,
    },
    callbacks: {
      afterInsert: (d) => afterDoctype(d, true),
      afterUpdate: afterDoctype,
    },
  })
}

function afterDoctype(d, isInsert = false) {
  activities.value.reload()

  let name =
    d.doctype == 'FCRM Note'
      ? 'note'
      : d.doctype == 'CRM Task'
        ? 'task'
        : 'call_log'

  let redirectHash = name + 's'
  if (d.doctype == 'CRM Call Log') {
    redirectHash = 'calls'
  }

  if (isInsert) {
    updateOnboardingStep('create_first_' + name)
    capture(name + '_created')
  } else {
    capture(name + '_updated')
  }

  redirect(redirectHash)
}

// Call Logs
function createCallLog() {
  showModal({
    doctype: 'CRM Call Log',
    title: 'Call Log',
    defaults: {
      reference_doctype: props.doctype,
      reference_docname: props.doc?.name,
      reference_doc: { ...props.doc },
    },
    callbacks: {
      afterInsert: (d) => afterDoctype(d, true),
      afterUpdate: afterDoctype,
    },
  })
}

// common
const route = useRoute()
const router = useRouter()

function redirect(tabName) {
  if (route.name == 'Lead' || route.name == 'Deal' || route.name == 'Project') {
    let hash = '#' + tabName
    if (route.hash != hash) {
      router.push({ ...route, hash })
    }
  }
}

defineExpose({
  showTask,
  deleteTask,
  updateTaskStatus,
  showNote,
  createCallLog,
  showProjectTask,
  deleteProjectTask,
  updateProjectTaskStatus,
  showGammaProposal,
  showQuotation,
  
})
</script>
