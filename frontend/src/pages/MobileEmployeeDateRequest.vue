<template>
  <LayoutHeader>
    <header
      class="relative flex h-10.5 items-center justify-between gap-2 py-2.5 pl-2"
    >
      <Breadcrumbs :items="breadcrumbs">
        <template #prefix="{ item }">
          <Icon v-if="item.icon" :icon="item.icon" class="mr-2 h-4" />
        </template>
      </Breadcrumbs>
      <div class="absolute right-0">
        <Button
            v-if="doc.status"
            :label="doc.status"
            
          >
          <!-- :iconRight="open ? 'chevron-up' : 'chevron-down'" -->
            <template #prefix>
              <IndicatorIcon :class="statusColor(doc.status)" />
            </template>
          </Button>
      </div>
    </header>
  </LayoutHeader>
  <div
    v-if="doc.name"
    class="flex h-12 items-center justify-between gap-2 border-b px-3 py-2.5"
  >
    <AssignTo v-model="assignees.data" doctype="Employee Date Request" :docname="requestId" />
    <div class="flex items-center gap-2">
      <CustomActions
        v-if="document._actions?.length"
        :actions="document._actions"
      />
      <CustomActions
        v-if="document.actions?.length"
        :actions="document.actions"
      />
    </div>
  </div>
  <div v-if="doc.name" class="flex h-full overflow-hidden">
    <Tabs v-if="tabs && tabs.length" as="div" v-model="tabIndex" :tabs="tabs" class="overflow-auto">
      <TabList class="!px-3" />
      <TabPanel v-slot="{ tab }">
        <div v-if="tab.name == 'Details'">
          <SLASection
            v-if="doc.sla_status"
            v-model="doc"
            @updateField="updateField"
          />
          <div
            v-if="sections.data"
            class="flex flex-1 flex-col justify-between overflow-hidden"
          >
            <SidePanelLayout
              :sections="sections.data"
              doctype="Employee Date Request"
              :docname="requestId"
              @reload="sections.reload"
              @beforeFieldChange="beforeStatusChange"
              @afterFieldChange="reloadAssignees"
            >


            </SidePanelLayout>
          </div>
        </div>
        <Activities
          v-else
          doctype="Employee Date Request"
          :docname="requestId"
          :tabs="tabs"
          v-model:reload="reload"
          v-model:tabIndex="tabIndex"
          @beforeSave="beforeStatusChange"
          @afterSave="reloadAssignees"
        />
      </TabPanel>
    </Tabs>
  </div>
  <ErrorPage
    v-else-if="errorTitle"
    :errorTitle="errorTitle"
    :errorMessage="errorMessage"
  />


  <DeleteLinkedDocModal
    v-if="showDeleteLinkedDocModal"
    v-model="showDeleteLinkedDocModal"
    :doctype="'Employee Date Request'"
    :docname="requestId"
    name="Employee Date Requests"
  />
  <LostReasonModal
    v-if="showLostReasonModal"
    v-model="showLostReasonModal"
    :deal="document"
  />
</template>
<script setup>
import DeleteLinkedDocModal from '@/components/DeleteLinkedDocModal.vue'
import ErrorPage from '@/components/ErrorPage.vue'
import Icon from '@/components/Icon.vue'
import DetailsIcon from '@/components/Icons/DetailsIcon.vue'
import LoadingIndicator from '@/components/Icons/LoadingIndicator.vue'
import ActivityIcon from '@/components/Icons/ActivityIcon.vue'
import EmailIcon from '@/components/Icons/EmailIcon.vue'
import Email2Icon from '@/components/Icons/Email2Icon.vue'
import CommentIcon from '@/components/Icons/CommentIcon.vue'
import PhoneIcon from '@/components/Icons/PhoneIcon.vue'
import TaskIcon from '@/components/Icons/TaskIcon.vue'
import NoteIcon from '@/components/Icons/NoteIcon.vue'
import AttachmentIcon from '@/components/Icons/AttachmentIcon.vue'
import WhatsAppIcon from '@/components/Icons/WhatsAppIcon.vue'
import IndicatorIcon from '@/components/Icons/IndicatorIcon.vue'
import ArrowUpRightIcon from '@/components/Icons/ArrowUpRightIcon.vue'
import SuccessIcon from '@/components/Icons/SuccessIcon.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import Activities from '@/components/Activities/Activities.vue'

import LostReasonModal from '@/components/Modals/LostReasonModal.vue'
import AssignTo from '@/components/AssignTo.vue'



import SidePanelLayout from '@/components/SidePanelLayout.vue'
import SLASection from '@/components/SLASection.vue'
import CustomActions from '@/components/CustomActions.vue'
import { setupCustomizations } from '@/utils'
import { getView } from '@/utils/view'
import { getSettings } from '@/stores/settings'
import { globalStore } from '@/stores/global'
import { statusesStore } from '@/stores/statuses'
import { getMeta } from '@/stores/meta'
import { useDocument } from '@/data/document'
import {
  whatsappEnabled,
  callEnabled,
  isMobileView,
} from '@/composables/settings'
import { useActiveTabManager } from '@/composables/useActiveTabManager'
import {
  createResource,
  Dropdown,
  Tabs,
  TabList,
  TabPanel,
  Breadcrumbs,
  call,
  usePageMeta,
  toast,
} from 'frappe-ui'
import { ref, computed, h, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const { brand } = getSettings()
const { $dialog, $socket } = globalStore()
const { statusOptions, getDealStatus } = statusesStore()
const { doctypeMeta } = getMeta('Employee Date Request')
const route = useRoute()
const router = useRouter()

const props = defineProps({
  requestId: {
    type: String,
    required: true,
  },
})

const errorTitle = ref('')
const errorMessage = ref('')
const showDeleteLinkedDocModal = ref(false)

const { triggerOnChange, assignees, document, scripts, error } = useDocument(
  'Employee Date Request',
  props.requestId,
)

const doc = computed(() => document.doc || {})

watch(error, (err) => {
  if (err) {
    errorTitle.value = __(
      err.exc_type == 'DoesNotExistError'
        ? 'Document not found'
        : 'Error occurred',
    )
    errorMessage.value = __(err.messages?.[0] || 'An error occurred')
  } else {
    errorTitle.value = ''
    errorMessage.value = ''
  }
})

watch(
  () => document.doc,
  async (_doc) => {
    if (scripts.data?.length) {
      let s = await setupCustomizations(scripts.data, {
        doc: _doc,
        $dialog,
        $socket,
        router,
        toast,
        updateField,
        createToast: toast.create,
        deleteDoc: deleteDeal,
        call,
      })
      document._actions = s.actions || []
      document._statuses = s.statuses || []
    }
  },
  { once: true },
)



const breadcrumbs = computed(() => {
  let items = [{ label: __('Employee Date Requests'), route: { name: 'Employee Date Requests' } }]

  if (route.query.view || route.query.viewType) {
    let view = getView(route.query.view, route.query.viewType, 'Employee Date Request')
    if (view) {
      items.push({
        label: __(view.label),
        icon: view.icon,
        route: {
          name: 'Employee Date Requests',
          params: { viewType: route.query.viewType },
          query: { view: route.query.view },
        },
      })
    }
  }

  items.push({
    label: title.value,
    route: { name: 'Employee Date Request', params: { requestId: props.requestId } },
  })
  return items
})

const title = computed(() => {
  let t = doctypeMeta['Employee Date Request']?.title_field || 'name'
  return doc.value?.[t] || props.requestId
})

usePageMeta(() => {
  return {
    title: title.value,
    icon: brand.favicon,
  }
})

const tabs = computed(() => {
  let tabOptions = [
    {
      name: 'Details',
      label: __('Details'),
      icon: DetailsIcon,
      condition: () => isMobileView.value,
    },
    {
      name: 'Activity',
      label: __('Activity'),
      icon: ActivityIcon,
    },
    {
      name: 'Emails',
      label: __('Emails'),
      icon: EmailIcon,
    },
    {
      name: 'Comments',
      label: __('Comments'),
      icon: CommentIcon,
    },
    {
      name: 'Data',
      label: __('Data'),
      icon: DetailsIcon,
    },
    // {
    //   name: 'Calls',
    //   label: __('Calls'),
    //   icon: PhoneIcon,
    //   condition: () => callEnabled.value,
    // },
    // {
    //   name: 'Tasks',
    //   label: __('Tasks'),
    //   icon: TaskIcon,
    // },
    // {
    //   name: 'Project Tasks',
    //   label: __('Project Tasks'),
    //   icon: TaskIcon,
    // },
    {
      name: 'Notes',
      label: __('Notes'),
      icon: NoteIcon,
    },
    {
      name: 'Attachments',
      label: __('Attachments'),
      icon: AttachmentIcon,
    },
    {
      name: 'WhatsApp',
      label: __('WhatsApp'),
      icon: WhatsAppIcon,
      condition: () => whatsappEnabled.value,
    },
  ]
  return tabOptions.filter((tab) => (tab.condition ? tab.condition() : true))
})
const { tabIndex } = useActiveTabManager(tabs, 'lastDealTab')

const sections = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_sidepanel_sections',
  cache: ['sidePanelSections', 'Employee Date Request'],
  params: { doctype: 'Employee Date Request' },
  auto: true,
  transform: (data) => getParsedFields(data),
})

function getParsedFields(sections) {
  return sections
}

if (!sections.data) sections.fetch()


function updateField(name, value) {
  value = Array.isArray(name) ? '' : value
  let oldValues = Array.isArray(name) ? {} : doc.value[name]

  if (Array.isArray(name)) {
    name.forEach((field) => (doc.value[field] = value))
  } else {
    doc.value[name] = value
  }

  document.save.submit(null, {
    onSuccess: () => (reload.value = true),
    onError: (err) => {
      if (Array.isArray(name)) {
        name.forEach((field) => (doc.value[field] = oldValues[field]))
      } else {
        doc.value[name] = oldValues
      }
      toast.error(err.messages?.[0] || __('Error updating field'))
    },
  })
}

function deleteDeal() {
  showDeleteLinkedDocModal.value = true
}

async function triggerStatusChange(value) {
  await triggerOnChange('status', value)
  // setLostReason()
}

const showLostReasonModal = ref(false)

function setLostReason() {
  if (
    getDealStatus(doc.status).type !== 'Lost' ||
    (doc.lost_reason && doc.lost_reason !== 'Other') ||
    (doc.lost_reason === 'Other' && doc.lost_notes)
  ) {
    document.save.submit()
    return
  }

  showLostReasonModal.value = true
}

function beforeStatusChange(data) {
  // if (
  //   data?.hasOwnProperty('status') &&
  //   getDealStatus(data.status).type == 'Lost'
  // ) {
  //   setLostReason()
  // } else {
  //   document.save.submit(null, {
  //     onSuccess: () => reloadAssignees(data),
  //   })
  // }
  document.save.submit(null, {
      onSuccess: () => reloadAssignees(data),
    })
}

function reloadAssignees(data) {
  if (data?.hasOwnProperty('deal_owner')) {
    assignees.reload()
  }
}

function statusColor(status) {
  if (!status) return ''
  if (status === 'Approved') return 'text-green-600'
  if (status === 'Reject') return 'text-red-600'
  if( status === 'Pending Approval' || status === 'Planning') return 'text-yellow-600'
  if (status === 'Completed' || status === 'Done') return 'text-blue-600'
  if (status === 'Draft' || status === 'Cancelled') return 'text-gray-600'
  return 'text-gray-500'
}

</script>
