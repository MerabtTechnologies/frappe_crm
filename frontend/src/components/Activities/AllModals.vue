<template>
  <!-- Global modals are handled by GlobalModals component -->
</template>
<script setup>
import { useDoctypeModal } from '@/composables/doctypeModal'
import { useOnboarding, useTelemetry } from 'frappe-ui/frappe'
import { call } from 'frappe-ui'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  doctype: { type: String, default: '' },
  doc: { type: Object, default: () => ({}) },
})

const activities = defineModel({ type: Object })

const { showModal } = useDoctypeModal()
const { updateOnboardingStep } = useOnboarding('frappecrm')
const { capture } = useTelemetry()

// Tasks
function showTask(taskData) {
  showModal({
    name: taskData?.name,
    doctype: 'CRM Task',
    title: 'Task',
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

function showProjectTask(taskData) {
  showModal({
    name: taskData?.name,
    doctype: 'Smart Task',
    title: 'Project Task',
    defaults: {
      project: props.doc?.name,
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

async function deleteProjectTask(name) {
  await call('frappe.client.delete', {
    doctype: 'Smart Task',
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

function updateProjectTaskStatus(status, task) {
  call('frappe.client.set_value', {
    doctype: 'Smart Task',
    name: task.name,
    fieldname: 'status',
    value: status,
  }).then(() => {
    activities.value.reload()
  })
}

// Notes
function showNote(noteData) {
  showModal({
    name: noteData?.name,
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

  let name = 'call_log'
  let redirectHash = 'calls'

  if (d.doctype == 'FCRM Note') {
    name = 'note'
    redirectHash = 'notes'
  } else if (d.doctype == 'CRM Task') {
    name = 'task'
    redirectHash = 'tasks'
  } else if (d.doctype == 'Smart Task') {
    name = 'project_task'
    redirectHash = 'project_tasks'
  } else if (d.doctype == 'Gamma Proposal') {
    name = 'gamma_proposal'
    redirectHash = 'gamma'
  } else if (d.doctype == 'Quotation') {
    name = 'quotation'
    redirectHash = 'quotations'
  } else if (d.doctype == 'CRM Call Log') {
    name = 'call_log'
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
function showGammaProposal(proposalData) {
  showModal({
    name: proposalData?.name,
    doctype: 'Gamma Proposal',
    title: 'Gamma Proposal',
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

async function deleteGammaProposal(name) {
  await call('frappe.client.delete', {
    doctype: 'Gamma Proposal',
    name,
  })
  activities.value.reload()
}

function updateGammaProposalStatus(status, proposal) {
  call('frappe.client.set_value', {
    doctype: 'Gamma Proposal',
    name: proposal.name,
    fieldname: 'status',
    value: status,
  }).then(() => {
    activities.value.reload()
  })
}

function showQuotation(quotationData) {
  showModal({
    name: quotationData?.name,
    doctype: 'Quotation',
    title: 'Quotation',
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
  showProjectTask,
  deleteProjectTask,
  updateProjectTaskStatus,
  showGammaProposal,
  deleteGammaProposal,
  updateGammaProposalStatus,
  showQuotation,
  showNote,
  createCallLog,
})
</script>
