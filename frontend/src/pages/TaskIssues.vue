<template>
  <LayoutHeader>
    <template #left-header>
      <ViewBreadcrumbs v-model="viewControls" routeName="Issues" label="Task Issues" />
    </template>
    <template #right-header>
      <CustomActions
        v-if="tasksListView?.customListActions"
        :actions="tasksListView.customListActions"
      />
      <Button
        variant="solid"
        :label="__('Create')"
        iconLeft="plus"
        @click="createTask"
      />
    </template>
  </LayoutHeader>
  <ViewControls
    ref="viewControls"
    v-model="tasks"
    v-model:loadMore="loadMore"
    v-model:resizeColumn="triggerResize"
    v-model:updatedPageCount="updatedPageCount"
    doctype="Issue"
    
  />
  <div class="mt-4 p-2 bg-gray-50 ">
    <!-- Filters and Create are provided by ViewControls -->

    <!-- 3-column layout: Today / Overdue / Upcoming -->
    <div class="overflow-x-auto">
      <div class="flex gap-4 md:grid md:grid-cols-3">
      <div class="bg-white rounded shadow-sm p-3" style="min-width:260px; flex:0 0 260px;">
        <div class="mb-2 px-2 border-solid border-b border-gray-300 justify-between flex">
          <div class="font-semibold mb-2 text-center "">{{ __('Today') }}</div>
          <div class="font-semibold mb-2 text-center ">{{ `[${todayItems.length}]` }}</div>
        </div>
        <div class="flex flex-col gap-2">
          <IssueItem
            v-for="item in todayItems"
            :key="item.name"
            :item="item"
            :actions="actions"
            @open="showTask"
            @redirect="redirect"
          />
        </div>
      </div>

      <div class="bg-white rounded shadow-sm p-3" style="min-width:260px; flex:0 0 260px;">
        <div class="mb-2 px-2 border-solid border-b border-gray-300 justify-between flex">
          <div class="font-semibold mb-2 text-center">{{ __('Overdue') }}</div>
          <div class="font-semibold mb-2 text-center">{{ `[${overdueItems.length}]` }}</div>
        </div>
        <div class="flex flex-col gap-2">
          <IssueItem
            v-for="item in overdueItems"
            :key="item.name"
            :item="item"
            :actions="actions"
            @open="showTask"
            @redirect="redirect"
          />
        </div>
      </div>

      <div class="bg-white rounded shadow-sm p-3" style="min-width:260px; flex:0 0 260px;">
        <div class="mb-2 px-2 border-solid border-b border-gray-300 justify-between flex">
          <div class="font-semibold mb-2 text-center">{{ __('Completed/Closed') }}</div>
          <div class="font-semibold mb-2 text-center">{{ `[${completedItems.length}]` }}</div>
        </div>
        <div class="flex flex-col gap-2">
          <IssueItem
            v-for="item in completedItems"
            :key="item.name"
            :item="item"
            :actions="actions"
            @open="showTask"
            @redirect="redirect"
          />
        </div>
      </div>
      </div>
    </div>
  </div>
  <IssueViewModal
    v-if="showTaskModal"
    v-model="showTaskModal"
    v-model:reloadIssues="tasks"
    :task="task"
  />
  <IssueModal
    v-if="showTaskCreateModal"
    v-model="showTaskCreateModal"
    v-model:reloadIssues="tasks"
    :defaults="task"
    :create="data_edit"
  />
  <IssueModalEdit
    v-if="data_edit"
    v-model="data_edit"
    v-model:reloadIssues="tasks"
    :defaults="task"
    :create="data_edit"
  />
</template>

<script setup>
import ViewBreadcrumbs from '@/components/ViewBreadcrumbs.vue'
import CustomActions from '@/components/CustomActions.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import ViewControls from '@/components/ViewControls.vue'
import IssueViewModal from '@/components/Modals/IssueViewModal.vue'
import IssueModalEdit from '@/components/Modals/IssueModalEdit.vue'
import IssueModal from '@/components/Modals/IssueModal.vue'
import IssueItem from '@/components/IssueItem.vue'
import { getMeta } from '@/stores/meta'
import { usersStore } from '@/stores/users'
import { formatDate, timeAgo } from '@/utils'
import { call, ListItem, toast } from 'frappe-ui'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { globalStore } from '@/stores/global'


const { getFormattedPercent, getFormattedFloat, getFormattedCurrency } =
  getMeta('Issue')
const { getUser } = usersStore()

const router = useRouter()

const { $dialog, $socket, makeCall } = globalStore()

const tasksListView = ref(null)

// tasks data is loaded in the ViewControls component
const tasks = ref({})
const loadMore = ref(1)
const triggerResize = ref(1)
const updatedPageCount = ref(20)
const viewControls = ref(null)

function getRow(name, field) {
  function getValue(value) {
    if (value && typeof value === 'object') {
      return value
    }
    return { label: value }
  }
  return getValue(rows.value?.find((row) => row.name == name)[field])
}

const rows = computed(() => {
  if (!tasks.value?.data?.data) return []

  if (tasks.value.data.view_type === 'kanban') {
    return getKanbanRows(tasks.value.data.data, tasks.value.data.fields)
  }

  openTaskFromURL()
  return parseRows(tasks.value?.data.data, tasks.value?.data.columns)
})

function getLabel(value) {
  if (value == null) return ''
  return typeof value === 'object' ? value.label : value
}
function parseDateSafe(value) {
  if (!value) return null
  if (typeof value === 'object' && value.label) {
    value = value.label
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  return d
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const todayItems = computed(() => {
  const s = startOfDay(new Date())
  const t = new Date(s)
  t.setDate(t.getDate() + 1)
  const dated_data = (rows.value || []).filter((item) => {
    const d = parseDateSafe(item.creation ?? item.opening_date_raw)
    if (!d) return false
    return d >= s && d < t
  })
  return dated_data.filter(item => !['Resolved', 'Closed'].includes(item.status))
})

const overdueItems = computed(() => {
  const s = startOfDay(new Date())
  const dated_data = (rows.value || []).filter((item) => {
    const d = parseDateSafe(item.creation ?? item.opening_date_raw)
    if (!d) return false
    return d < s
  })
  return dated_data.filter(item => !['Resolved', 'Closed'].includes(item.status))
})

const completedItems = computed(() => {
  const dated_data = (rows.value || []).filter((item) => {
    const d = parseDateSafe(item.creation ?? item.opening_date_raw)
    if (!d) return false
    return ['Resolved', 'Closed'].includes(item.status)
  })
  return dated_data
})

const columns = computed(() => {
  let _columns = tasks.value?.data?.columns || []

  // Set align right for last column
  if (_columns.length) {
    _columns = _columns.map((col, index) => {
      if (index === _columns.length - 1) {
        return { ...col, align: 'right' }
      }
      return col
    })
  }

  return _columns
})

function getKanbanRows(data, columns) {
  let _rows = []
  data.forEach((column) => {
    column.data?.forEach((row) => {
      _rows.push(row)
    })
  })
  return parseRows(_rows, columns)
}

function parseRows(rows, columns = []) {
  let view_type = tasks.value.data.view_type
  let key = view_type === 'kanban' ? 'fieldname' : 'key'
  let type = view_type === 'kanban' ? 'fieldtype' : 'type'

  return rows.map((task) => {
    let _rows = {}
    tasks.value?.data.rows.forEach((row) => {
      _rows[row] = task[row]

      let fieldType = columns?.find((col) => (col[key] || col.value) == row)?.[
        type
      ]

      if (
        fieldType &&
        ['Date', 'Datetime'].includes(fieldType) &&
        !['modified', 'creation', 'due_date'].includes(row)
      ) {
        _rows[row] = formatDate(task[row], '', true, fieldType == 'Datetime')
        _rows[`${row}_raw`] = task[row]
      }

      if (fieldType && fieldType == 'Currency') {
        _rows[row] = getFormattedCurrency(row, task)
      }

      if (fieldType && fieldType == 'Float') {
        _rows[row] = getFormattedFloat(row, task)
      }

      if (fieldType && fieldType == 'Percent') {
        _rows[row] = getFormattedPercent(row, task)
      }

      if (['modified', 'creation'].includes(row)) {
        _rows[row] = {
          label: formatDate(task[row]),
          timeAgo: __(timeAgo(task[row])),
        }
      } else if (row == 'assigned_to') {
        _rows[row] = {
          label: task.assigned_to && getUser(task.assigned_to).full_name,
          ...(task.assigned_to && getUser(task.assigned_to)),
        }
      }
    })
    return _rows
  })
}

const showTaskModal = ref(false)
const showTaskCreateModal = ref(false)
const data_edit = ref(false)


// change this to pass data to issue modal instead of task modal for new data creation
const task = ref({
  name: '',
  subject: '',
  title: '',
  description: '',
  custom_task: '',
  custom_assigned_to: '',
  opening_date: '',
  opening_time: '',
  status: 'Backlog',
  priority: 'Low',
  issue_type: '',
  resolution_details: '',
  reference_doctype: 'CRM Lead',
  reference_docname: '',
})

// change this to pass data to issue modal instead of task modal
function showTask(name, edit = false) {
  const searchName = String(name)
  const t = rows.value?.find((row) => String(row.name) === searchName)
  if (!t) {
    // row not found yet — likely data not loaded. fail gracefully.
    console.warn('showTask: task not found', name)
    return
  }
  task.value = {
    name: t.name || '',
    title: t.title || '',
    subject: t.subject || '',
    description: t.description || '',
    custom_task: t.custom_task || '',
    custom_assigned_to: t.custom_assigned_to || '',
    status: t.status || '',
    priority: t.priority || '',
    issue_type: t.issue_type || '',
    resolution_details: t.resolution_details || '',
    reference_doctype: t.reference_doctype || '',
    reference_docname: t.reference_docname || '',
  }
  if(edit) {
    showTaskCreateModal.value = true
  } else {
    task.value = {
      ...task.value,
      owner: t.owner || '',
      creation: t.creation || '',
      opening_date: t.opening_date || '',
      opening_time: t.opening_time || '',
    }
    showTaskModal.value = true
  }
}

function editTask(name) {
  task.value = {
    name: name,
  }


  data_edit.value = true
}

function createTask(column) {
  task.value = {
    name: '',
    title: '',
    subject: '',
    description: '',
    custom_task: '',
    custom_assigned_to: '',
    opening_date: '',
    opening_time: '',
    issue_type: '',
    status: 'Open',
    priority: 'Low',
    resolution_details: '',
    reference_doctype: 'CRM Lead',
    reference_docname: '',
  }

  if (column.column?.name) {
    let column_field = tasks.value.params.column_field
    if (column_field) {
      task.value[column_field] = column.column.name
    }
  }

  showTaskCreateModal.value = true
}

function actions(name) {
  return [
    {
      label: __('Delete'),
      icon: 'trash-2',
      onClick: () => {
        deletetask(name)
        tasks.value.reload()
      },
    },
    {
      label: __('Edit'),
      icon: 'edit-2',
      onClick: () => {
        // showTask(name, true)
        editTask(name)

      },
    },
  ]
}

async function deletetask(name) {
  await call('frappe.client.delete', {
    doctype: 'Issue',
    name,
  })
}

function redirect(doctype, docname) {
  if (!docname) return
  let name = doctype == 'CRM Deal' ? 'Deal' : 'Lead'
  let params = { leadId: docname }
  if (name == 'Deal') {
    params = { dealId: docname }
  }
  router.push({ name: name, params: params })
}

const openTaskFromURL = () => {
  const searchParams = new URLSearchParams(window.location.search)
  const taskName = searchParams.get('open')

  if (!taskName) return

  const tryOpen = () => {
    if (!rows.value?.length) return false
    const found = rows.value.find((row) => String(row.name) === String(taskName))
    if (found) {
      showTask(found.name)
      searchParams.delete('open')
      window.history.replaceState(null, '', window.location.pathname)
      return true
    }
    return false
  }

  // Try immediately
  if (tryOpen()) return

  // Retry for a short period while data loads
  const interval = setInterval(() => {
    if (tryOpen()) {
      clearInterval(interval)
    }
  }, 200)

  // stop retrying after 5s
  setTimeout(() => clearInterval(interval), 5000)
}

onMounted(() => {
  $socket.on('new_issue_notification', () => {
    toast.success(__('New Task Ticket Created'))
    // console.log("socket capture : new_issue_notification");
    
  })
})

onBeforeUnmount(() => {
  $socket.off('new_issue_notification')
})

</script>
