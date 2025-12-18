<template>
  <div class="flex flex-col h-full overflow-hidden">
    <LayoutHeader>
      <template #left-header>
        <ViewBreadcrumbs routeName="Projects" />
      </template>
      <template #right-header>
        <Button :label="__('Refresh')" iconLeft="refresh-ccw" @click="reloadAll" />
      </template>
    </LayoutHeader>

    <div class="p-5">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingIndicator class="h-8 w-8" />
      </div>

      <div v-else>
        <div class="grid gap-4 mb-6" style="grid-template-columns: repeat(auto-fit,minmax(220px,1fr));">
          <div class="card p-4 card-clickable" v-for="card in statCards" :key="card.key" @click="cardClick(card)" role="button" tabindex="0" @keydown.enter.prevent="cardClick(card)" @keydown.space.prevent="cardClick(card)">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-ink-gray-6">{{ __(card.label) }}</div>
                <div class="text-2xl font-semibold">{{ card.value }}</div>
              </div>
              <div v-if="card.meta" class="text-sm text-ink-gray-5">{{ card.meta }}</div>
            </div>
          </div>
        </div>

        <!-- Task status subheading / badges -->
        <div class="mb-4">
          <div class="text-sm text-ink-gray-6 mb-2">{{ __('Task Statuses') }}</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(count, status) in taskStatusCounts"
              :key="status"
              class="status-pill"
              :class="statusClass(status)"
              @click="goToTaskList(status)"
              role="button"
              tabindex="0"
              @keydown.enter="goToTaskList(status)"
            >
              <strong class="mr-2">{{ status }}</strong>
              <span>{{ count }}</span>
            </span>
          </div>
        </div>

        <div class="grid gap-4" style="grid-template-columns: 2fr 1fr;">
          <div class="card p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="m-0">{{ __('Tasks Over Time') }}</h4>
              <div class="text-sm text-ink-gray-5">{{ axisLabel }}</div>
            </div>
            <AxisChart v-if="axisConfig" :config="axisConfig" />
            <div v-else class="text-center text-ink-gray-5 py-8">{{ __('No data') }}</div>
          </div>

          <div class="card p-4">
            <h4 class="mb-3">{{ __('Tasks by Status') }}</h4>
            <DonutChart v-if="donutConfig" :config="donutConfig" />
            <div v-else class="text-center text-ink-gray-5 py-8">{{ __('No data') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import LayoutHeader from '@/components/LayoutHeader.vue'
import ViewBreadcrumbs from '@/components/ViewBreadcrumbs.vue'
import LoadingIndicator from '@/components/Icons/LoadingIndicator.vue'
import { Button, AxisChart, DonutChart, createResource, toast } from 'frappe-ui'
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const projectsRes = createResource({
  url: 'smart_pro.smart_pro.api.projects.get_user_projects',
  auto: true,
})

const tasksRes = createResource({
  url: 'smart_pro.smart_pro.api.projects.get_user_tasks',
  auto: true,
})

const requestsRes = createResource({
  url: 'smart_pro.smart_pro.api.projects.get_pending_date_requests',
  auto: true,
})

const loading = computed(() => projectsRes.loading || tasksRes.loading || requestsRes.loading)

const projects = computed(() => projectsRes.data || [])
const tasks = computed(() => tasksRes.data || [])
const requests = computed(() => requestsRes.data || [])
const router = useRouter()


function reloadAll() {
  projectsRes.reload()
  tasksRes.reload()
  requestsRes.reload()
}

watch([projectsRes, tasksRes, requestsRes], ([p, t, r]) => {
  if (p.error) toast.error(p.error?.message || __('Failed to load projects'))
  if (t.error) toast.error(t.error?.message || __('Failed to load tasks'))
  if (r.error) toast.error(r.error?.message || __('Failed to load requests'))
})

function normalizeList(obj) {
  if (!obj) return []
  if (Array.isArray(obj)) return obj
  if (obj.message && Array.isArray(obj.message)) return obj.message
  if (obj.data && Array.isArray(obj.data)) return obj.data
  if (obj.results && Array.isArray(obj.results)) return obj.results
  return []
}

const statCards = computed(() => {
  const proj = normalizeList(projects.value)
  const t = normalizeList(tasks.value)
  const req = normalizeList(requests.value)
  return [
    { key: 'projects', label: 'Projects', value: proj.length, meta: `${proj.filter(p => p.status === 'Active').length} ${__('Active')}` },
    { key: 'tasks', label: 'Tasks', value: t.length, meta: `${t.filter(x => x.status === 'Open').length} ${__('Open')}` },
    { key: 'requests', label: 'Date Requests', value: req.length, meta: null },
  ]
})

const taskStatusCounts = computed(() => {
  const list = normalizeList(tasks.value)
  const statuses = ['Active','Open','Working','Completed','Pending Approval','Pending Review','On Hold','Cancelled']
  const map = {}
  statuses.forEach(s => map[s] = 0)
  list.forEach(t => {
    const s = t.status || 'Unknown'
    if (!map.hasOwnProperty(s)) map[s] = 0
    map[s] = (map[s] || 0) + 1
  })
  return map
})

function statusClass(status) {
  const normalized = (status || '').toLowerCase().replace(/\s+/g, '-')
  return `status-${normalized}`
}

const axisConfig = ref(null)
const donutConfig = ref(null)
const axisLabel = ref('')

function buildCharts() {
  try {
    const tlist = normalizeList(tasks.value)
    // group by creation day
    const counts = {}
    tlist.forEach(tt => {
      const d = tt.creation ? tt.creation.split('T')[0] : null
      if (!d) return
      counts[d] = (counts[d] || 0) + 1
    })
    const labels = Object.keys(counts)
    // ensure labels is an array before sorting
    const sortedLabels = Array.isArray(labels) ? labels.sort() : []
    const values = sortedLabels.map(l => counts[l])
    if (sortedLabels.length) {
      axisConfig.value = { data: { labels: sortedLabels, datasets: [{ name: 'Tasks', values }] }, type: 'line' }
      axisLabel.value = `${sortedLabels.length} ${__('days')}`
    } else {
      axisConfig.value = null
      axisLabel.value = ''
    }

    // donut by status
    const statusMap = {}
    tlist.forEach(tt => { const st = tt.status || 'Unknown'; statusMap[st] = (statusMap[st] || 0) + 1 })
    const dlabels = Object.keys(statusMap)
    const dvalues = Array.isArray(dlabels) ? dlabels.map(l => statusMap[l]) : []
    donutConfig.value = dlabels.length ? { data: { labels: dlabels, datasets: [{ name: 'Status', values: dvalues }] } } : null
  } catch (e) {
    console.error('buildCharts error', e)
  }
}

// TODO: implement navigation to task list filtered by status
function goToTaskList(status) {
  // const router = useRouter()
  const filters = JSON.stringify([['status', '=', status]])
  router.push({ name: 'Project Tasks', query: { filters } })
  // router.push({ name: 'Project Tasks', params: '' })
}

function cardClick(card) {
  if (card.key === 'projects') {
    router.push({ name: 'Projects' })
  } else if (card.key === 'tasks') {
    router.push({ name: 'Project Tasks' })
  } else if (card.key === 'requests') {
    router.push({ name: 'Employee Date Requests' })
  }
}

watch([projects, tasks, requests], () => buildCharts(), { immediate: true })

onMounted(() => {
  // in case resources didn't auto fetch
  if (!projectsRes.data) projectsRes.fetch()
  if (!tasksRes.data) tasksRes.fetch()
  if (!requestsRes.data) requestsRes.fetch()
})
</script>

<style scoped>
.card { background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.p-4 { padding: 1rem }
.text-muted { color: var(--muted); }

/* Task status pills */
.status-pill { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; background: #f1f5f9; color: #1f2937; }
.status-active { background: #d1fae5; color: #065f46; }
.status-open { background: #dbeafe; color: #1e3a8a; }
.status-working { background: #fef3c7; color: #92400e; }
.status-completed { background: #e6e6e6; color: #374151; }
.status-pending-approval, .status-pending-review { background: #fef3c7; color: #92400e; }
.status-on-hold { background: #fed7aa; color: #7c2d12; }
.status-cancelled { background: #fecaca; color: #7f1d1d; }
.status-unknown { background: #e5e7eb; color: #374151; }
.status-pill { cursor: pointer; user-select: none; }
.status-pill:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.06); }

/* Clickable stat card styles */
.card-clickable { cursor: pointer; transition: transform 160ms ease, box-shadow 160ms ease; }
.card-clickable:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(2,6,23,0.08); }
.card-clickable:active { transform: translateY(-2px); }
.card-clickable:focus { outline: 3px solid rgba(59,130,246,0.12); outline-offset: 2px; }
</style>
