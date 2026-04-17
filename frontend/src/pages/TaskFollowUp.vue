<template>
  <LayoutHeader>
    <template #left-header>
      <ViewBreadcrumbs v-model="viewControls" routeName="Tasks" />
    </template>
    <template #right-header>
      <CustomActions
        v-if="tasksListView?.customListActions"
        :actions="tasksListView.customListActions"
      />
      <Button
        variant="ghost"
        :label="filterByIssues ? __('Show All') : __('Only with Issues')"
        iconLeft="tag"
        @click="filterByIssues = !filterByIssues"
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
    doctype="CRM Task"
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
          <TaskItem
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
          <TaskItem
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
          <div class="font-semibold mb-2 text-center">{{ __('Upcoming') }}</div>
          <div class="font-semibold mb-2 text-center">{{ `[${upcomingItems.length}]` }}</div>
        </div>
        <div class="flex flex-col gap-2">
          <TaskItem
            v-for="item in upcomingItems"
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
  <TaskModal
    v-if="showTaskModal"
    v-model="showTaskModal"
    v-model:reloadTasks="tasks"
    :task="task"
  />
</template>

<script setup>
import ViewBreadcrumbs from '@/components/ViewBreadcrumbs.vue'
import CustomActions from '@/components/CustomActions.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import ViewControls from '@/components/ViewControls.vue'
import TaskModal from '@/components/Modals/TaskModal.vue'
import TaskItem from '@/components/TaskItem.vue'
import { getMeta } from '@/stores/meta'
import { usersStore } from '@/stores/users'
import { formatDate, timeAgo } from '@/utils'
import { call, createListResource } from 'frappe-ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const { getFormattedPercent, getFormattedFloat, getFormattedCurrency } =
  getMeta('CRM Task')
const { getUser } = usersStore()

const router = useRouter()


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

// Load Issue list (only need `custom_task` field) and compute referenced task ids
const issueTickets = createListResource({
  type: 'list',
  doctype: 'Issue',
  cache: ['issues', 'issue_all'],
  fields: ['custom_task'],
  orderBy: 'modified desc',
  pageLength: 1000,
  auto: true,
})

const issueTaskIds = computed(() => {
  const raw = issueTickets.data?.data || issueTickets.data || []
  return new Set(
    (raw || [])
      .map((it) => {
        const v = it?.custom_task || (it?.custom_task?.name ?? null)
        return v == null ? null : String(v)
      })
      .filter(Boolean),
  )
})

// Map of taskId -> issue count
const issueCounts = computed(() => {
  const raw = issueTickets.data?.data || issueTickets.data || []
  const counts = {}
  ;(raw || []).forEach((it) => {
    const v = it?.custom_task || (it?.custom_task?.name ?? null)
    const key = v == null ? null : String(v)
    if (!key) return
    counts[key] = (counts[key] || 0) + 1
  })
  return counts
})

const filterByIssues = ref(false)


const rows = computed(() => {
  if (!tasks.value?.data?.data) return []

  const viewType = tasks.value.data.view_type

  // Kanban uses the full dataset
  if (viewType === 'kanban') {
    return getKanbanRows(tasks.value.data.data, tasks.value.data.fields)
  }

  openTaskFromURL()

  // Work with raw rows so we can sort & limit for list view
  let raw = Array.isArray(tasks.value.data.data) ? [...tasks.value.data.data] : []

    // If enabled, filter tasks to only those referenced by issues
    if (filterByIssues.value && issueTaskIds.value && issueTaskIds.value.size) {
      raw = raw.filter((r) => issueTaskIds.value.has(String(r.name)))
  }

  // Sort by modified or creation (descending)
  raw.sort((a, b) => {
    const aDate = new Date(a.modified || a.creation || 0).getTime() || 0
    const bDate = new Date(b.modified || b.creation || 0).getTime() || 0
    return bDate - aDate
  })

  // Limit list view to top 20
  const limited = raw.slice(0, 20)

  const parsed = parseRows(limited, tasks.value?.data?.columns)

  // attach ticket counts to parsed rows
  parsed.forEach((t) => {
    t.tickets = issueCounts.value[String(t.name)] || 0
  })

  return parsed
})

function getLabel(value) {
  if (value == null) return ''
  return typeof value === 'object' ? value.label : value
}
function parseDateSafe(value) {
  if (!value) return null
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
    const d = parseDateSafe(item.due_date)
    if (!d) return false
    return d >= s && d < t
  })
  return dated_data.filter(item => !['Done', 'Canceled'].includes(item.status))
})

const overdueItems = computed(() => {
  const s = startOfDay(new Date())
  const dated_data = (rows.value || []).filter((item) => {
    const d = parseDateSafe(item.due_date)
    if (!d) return false
    return d < s
  })
  return dated_data.filter(item => !['Done', 'Canceled'].includes(item.status))
})

const upcomingItems = computed(() => {
  const t = new Date(startOfDay(new Date()))
  t.setDate(t.getDate() + 1)
  const dated_data = (rows.value || []).filter((item) => {
    const d = parseDateSafe(item.due_date)
    if (!d) return true
    return d >= t
  })
  return dated_data.filter(item => !['Done', 'Canceled'].includes(item.status))
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

const task = ref({
  name: '',
  title: '',
  description: '',
  assigned_to: '',
  due_date: '',
  status: 'Backlog',
  priority: 'Low',
  reference_doctype: 'CRM Lead',
  reference_docname: '',
})

function showTask(name) {
  let t = rows.value?.find((row) => row.name === name)
  task.value = {
    name: t.name,
    title: t.title,
    description: t.description,
    assigned_to: t.assigned_to?.name || '',
    due_date: t.due_date,
    status: t.status,
    priority: t.priority,
    reference_doctype: t.reference_doctype,
    reference_docname: t.reference_docname,
  }
  showTaskModal.value = true
}

function createTask(column) {
  task.value = {
    name: '',
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    status: 'Backlog',
    priority: 'Low',
    reference_doctype: 'CRM Lead',
    reference_docname: '',
  }

  if (column.column?.name) {
    let column_field = tasks.value.params.column_field
    if (column_field) {
      task.value[column_field] = column.column.name
    }
  }

  showTaskModal.value = true
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
  ]
}

async function deletetask(name) {
  await call('frappe.client.delete', {
    doctype: 'CRM Task',
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

  if (taskName && rows.value?.length) {
    showTask(parseInt(taskName))
    searchParams.delete('open')
    window.history.replaceState(null, '', window.location.pathname)
  }
}
</script>
