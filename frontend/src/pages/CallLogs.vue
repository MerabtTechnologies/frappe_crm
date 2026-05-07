<template>
  <LayoutHeader>
    <template #left-header>
      <ViewBreadcrumbs v-model="viewControls" routeName="Call Logs" />
    </template>
    <template #right-header>
      <CustomActions
        v-if="callLogsListView?.customListActions"
        :actions="callLogsListView.customListActions"
      />
      <Button
        variant="solid"
        :label="__('Create')"
        iconLeft="plus"
        @click="createCallLog"
      />
    </template>
  </LayoutHeader>
  <ViewControls
    ref="viewControls"
    v-model="callLogs"
    v-model:loadMore="loadMore"
    v-model:resizeColumn="triggerResize"
    v-model:updatedPageCount="updatedPageCount"
    doctype="CRM Call Log"
  />
  <CallLogsListView
    v-if="callLogs.data && rows.length"
    ref="callLogsListView"
    v-model="callLogs.data.page_length_count"
    v-model:list="callLogs"
    :rows="rows"
    :columns="columns"
    :options="{
      showTooltip: false,
      resizeColumn: true,
      rowCount: callLogs.data.row_count,
      totalCount: callLogs.data.total_count,
    }"
    @showCallLog="showCallLog"
    @loadMore="() => loadMore++"
    @columnWidthUpdated="() => triggerResize++"
    @updatePageCount="(count) => (updatedPageCount = count)"
    @applyFilter="(data) => viewControls.applyFilter(data)"
    @applyLikeFilter="(data) => viewControls.applyLikeFilter(data)"
    @likeDoc="(data) => viewControls.likeDoc(data)"
    @selectionsChanged="
      (selections) => viewControls.updateSelections(selections)
    "
  />
  <EmptyState
    v-else-if="callLogs.data && !rows.length"
    name="Call Logs"
    :icon="PhoneIcon"
  />
  <CallLogDetailModal
    v-model="showCallLogDetailModal"
    v-model:callLog="callLog"
  />
</template>

<script setup>
import ViewBreadcrumbs from '@/components/ViewBreadcrumbs.vue'
import CustomActions from '@/components/CustomActions.vue'
import PhoneIcon from '@/components/Icons/PhoneIcon.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import ViewControls from '@/components/ViewControls.vue'
import CallLogsListView from '@/components/ListViews/CallLogsListView.vue'
import EmptyState from '@/components/ListViews/EmptyState.vue'
import CallLogDetailModal from '@/components/Modals/CallLogDetailModal.vue'
import { useDoctypeModal } from '@/composables/doctypeModal'
import { getCallLogDetail } from '@/utils/callLog'
import { useTelemetry } from 'frappe-ui/frappe'
import { createResource } from 'frappe-ui'
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const callLogsListView = ref(null)

// callLogs data is loaded in the ViewControls component
const callLogs = ref({})
const loadMore = ref(1)
const triggerResize = ref(1)
const updatedPageCount = ref(20)
const viewControls = ref(null)
const route = useRoute()

const rows = computed(() => {
  if (
    !callLogs.value?.data?.data ||
    !['list', 'group_by'].includes(callLogs.value.data.view_type)
  )
    return []
  return callLogs.value?.data.data.map((callLog) => {
    let _rows = {}
    callLogs.value?.data.rows.forEach((row) => {
      _rows[row] = getCallLogDetail(row, callLog, callLogs.value?.data.columns)
    })
    return _rows
  })
})

const columns = computed(() => {
  let _columns = callLogs.value?.data?.columns || []

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

const showCallLogDetailModal = ref(false)
const callLog = ref({})

function showCallLog(name) {
  showCallLogDetailModal.value = true
  callLog.value = createResource({
    url: 'crm.fcrm.doctype.crm_call_log.crm_call_log.get_call_log',
    params: { name },
    cache: ['call_log', name],
    auto: true,
  })
}

const { showModal } = useDoctypeModal()
const { capture } = useTelemetry()

function createCallLog() {
  showModal({
    doctype: 'CRM Call Log',
    title: 'Call Log',
    callbacks: {
      afterInsert: () => {
        capture('call_log_created')
        callLogs.value.reload()
      },
    },
  })
}

const openCallLogFromURL = () => {
  const searchParams = new URLSearchParams(window.location.search)
  const callLogName = searchParams.get('open')

  if (callLogName) {
    showCallLog(callLogName)
    searchParams.delete('open')
    window.history.replaceState(null, '', window.location.pathname)
  }
}

onMounted(() => {
  openCallLogFromURL()
})

// Apply filters passed via URL (from Dashboard / other pages)
const applyFiltersFromURL = () => {
  const filtersParam = route.query.filters

  if (!filtersParam) return

  try {
    let filters = []

    if (typeof filtersParam === 'string') {
      filters = JSON.parse(filtersParam)
    } else if (Array.isArray(filtersParam)) {
      filters = filtersParam
    }

    if (Array.isArray(filters) && filters.length > 0) {
      const checkAndApply = () => {
        if (!viewControls.value || !callLogs.value.params) {
          setTimeout(checkAndApply, 100)
          return
        }

        const filterObj = {}

        filters.forEach((filter) => {
          if (filter.fieldname && filter.value !== undefined) {
            if (filter.condition === 'between') {
              if (Array.isArray(filter.value)) {
                filterObj[filter.fieldname] = ['between', filter.value]
              } else {
                filterObj[filter.fieldname] = filter.value
              }
            } else if (filter.condition === 'equals') {
              filterObj[filter.fieldname] = filter.value
            } else if (filter.condition === '>=') {
              filterObj[filter.fieldname] = ['>=', filter.value]
            } else if (filter.condition === '<=') {
              filterObj[filter.fieldname] = ['<=', filter.value]
            } else if (filter.condition === 'like' || filter.condition === 'LIKE') {
              filterObj[filter.fieldname] = ['like', `%${filter.value}%`]
            } else if (filter.condition === 'Not in') {
              filterObj[filter.fieldname] = ['not in', filter.value]
            } else if (filter.condition === 'In') {
              filterObj[filter.fieldname] = ['in', filter.value]
            } else if (filter.condition === 'is') {
              if (filter.value === 'not set') {
                filterObj[filter.fieldname] = ['is', 'not set']
              } else {
                filterObj[filter.fieldname] = ['is', filter.value]
              }
            } else {
              filterObj[filter.fieldname] = filter.value
            }
          }
        })

        // Apply filters to the list resource and reload
        callLogs.value.params.filters = filterObj
        if (callLogs.value.reload) {
          callLogs.value.reload()
        } else {
          loadMore.value++
        }
      }

      setTimeout(checkAndApply, 300)
    }
  } catch (error) {
    console.error('Error in applyFiltersFromURL:', error)
    console.error('Filters param was:', filtersParam)
  }
}

onMounted(() => {
  // Run after a short delay so ViewControls can initialize
  setTimeout(() => {
    applyFiltersFromURL()
  }, 500)
})

watch(() => route.query.filters, () => {
  setTimeout(() => {
    applyFiltersFromURL()
  }, 100)
})
</script>
