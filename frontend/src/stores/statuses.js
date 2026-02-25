import IndicatorIcon from '@/components/Icons/IndicatorIcon.vue'
import { parseColor } from '@/utils'
import { defineStore } from 'pinia'
import { useTelemetry } from 'frappe-ui/frappe'
import { createListResource } from 'frappe-ui'
import { reactive, h } from 'vue'


export const statusesStore = defineStore('crm-statuses', () => {
  let leadStatusesByName = reactive({})
  let dealStatusesByName = reactive({})
  let communicationStatusesByName = reactive({})

  const { capture } = useTelemetry()

  const leadStatuses = createListResource({
    doctype: 'CRM Lead Status',
    fields: ['name', 'color', 'position', 'type'],
    orderBy: 'position asc',
    cache: 'lead-statuses',
    initialData: [],
    auto: true,
    transform(statuses) {
      for (let status of statuses) {
        status.color = parseColor(status.color)
        leadStatusesByName[status.name] = status
      }
      return statuses
    },
  })

  const dealStatuses = createListResource({
    doctype: 'CRM Deal Status',
    fields: ['name', 'color', 'position', 'type'],
    orderBy: 'position asc',
    cache: 'deal-statuses',
    initialData: [],
    auto: true,
    transform(statuses) {
      for (let status of statuses) {
        status.color = parseColor(status.color)
        dealStatusesByName[status.name] = status
      }
      return statuses
    },
  })

  const communicationStatuses = createListResource({
    doctype: 'CRM Communication Status',
    fields: ['name'],
    cache: 'communication-statuses',
    initialData: [],
    auto: true,
    transform(statuses) {
      for (let status of statuses) {
        communicationStatusesByName[status.name] = status
      }
      return statuses
    },
  })

  function getLeadStatus(name) {
    if (!name) {
      name = leadStatuses.data[0].name
    }
    return leadStatusesByName[name]
  }

  function getDealStatus(name) {
    if (!name) {
      name = dealStatuses.data[0].name
    }
    return dealStatusesByName[name]
  }

  function getCommunicationStatus(name) {
    if (!name) {
      name = communicationStatuses.data[0].name
    }
    return communicationStatuses[name]
  }

  function statusOptions(doctype, statuses = [], triggerStatusChange = null) {
    let statusesByName =
      doctype == 'deal' ? dealStatusesByName : leadStatusesByName

    if (statuses?.length) {
      statusesByName = statuses.reduce((acc, status) => {
        acc[status] = statusesByName[status]
        return acc
      }, {})
    }

    let options = []
    for (const status in statusesByName) {
      options.push({
        label: statusesByName[status]?.name,
        value: statusesByName[status]?.name,
        icon: () => h(IndicatorIcon, { class: statusesByName[status]?.color }),
        onClick: async () => {
          await triggerStatusChange?.(statusesByName[status]?.name)
          capture('status_changed', { doctype, status })
        },
      })
    }
    return options
  }

  function statusOptionsAll(doctype, statuses = [], triggerStatusChange = null) {
    let options = []
    if (Array.isArray(statuses)) {
      for (const status of statuses) {
        options.push({
          label: status,
          value: status,
          // icon: () => h(IndicatorIcon, { class: statusColor(status) }),
          onClick: async () => {
            await triggerStatusChange?.(status)
            capture('status_changed', { doctype, status })
          },
        })
      }
    } else if (statuses && typeof statuses === 'object') {
      for (const status in statuses) {
        options.push({
          label: status,
          value: status,
          onClick: async () => {
            await triggerStatusChange?.(status)
            capture('status_changed', { doctype, status })
          },
        })
      }
    }
    return options
  }

  function statusColor(status) {
    if (!status) return ''
    if (status === 'Active') return 'text-green-600'
    if (status === 'On Hold') return 'text-red-600'
    if( status === 'Pending' || status === 'Planning') return 'text-yellow-600'
    if (status === 'Completed' || status === 'Done') return 'text-blue-600'
    if (status === 'Cancelled' || status === 'Lost') return 'text-gray-600'
    return 'text-gray-500'
  }

  return {
    leadStatuses,
    dealStatuses,
    communicationStatuses,
    getLeadStatus,
    getDealStatus,
    getCommunicationStatus,
    statusOptions,
    statusOptionsAll,
  }
})
