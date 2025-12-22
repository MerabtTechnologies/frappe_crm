<template>
  <TaskModal
    v-model="showTaskModal"
    v-model:reloadTasks="activities"
    :task="task"
    :doctype="doctype"
    :doc="doc?.name"
    @after="redirect('tasks')"
  />
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
</template>
<script setup>
import TaskModal from '@/components/Modals/TaskModal.vue'
import NoteModal from '@/components/Modals/NoteModal.vue'
import CallLogModal from '@/components/Modals/CallLogModal.vue'
import { call } from 'frappe-ui'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProjectTaskModal from '@/components/Modals/ProjectTaskModal.vue'
import GammaModal from '../Modals/GammaModal.vue'

const props = defineProps({
  doctype: String,
})

const activities = defineModel()
const doc = defineModel('doc')

// Tasks
const showTaskModal = ref(false)
const task = ref({})

function showTask(t) {
  task.value = t || {
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    priority: 'Low',
    status: 'Backlog',
  }
  showTaskModal.value = true
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
const showNoteModal = ref(false)
const note = ref({})

function showNote(n) {
  note.value = n || {
    title: '',
    content: '',
  }
  showNoteModal.value = true
}

// Call Logs
const showCallLogModal = ref(false)
const callLog = ref({})
const referenceDoc = ref({})

function createCallLog() {
  let doctype = props.doctype
  let docname = props.doc?.name
  referenceDoc.value = { ...props.doc }
  callLog.value = {
    reference_doctype: doctype,
    reference_docname: docname,
  }
  showCallLogModal.value = true
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
  
})
</script>
