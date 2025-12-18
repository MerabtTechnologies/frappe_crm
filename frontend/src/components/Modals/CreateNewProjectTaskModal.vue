<template>
  <Dialog v-model="show" :options="{ size: '3xl' }">
    <template #body>
      <div class="bg-surface-modal px-4 pb-6 pt-5 sm:px-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h3 class="text-2xl font-semibold leading-6 text-ink-gray-9">
              {{ __('Create Project Task') }}
            </h3>
          </div>
          <div class="flex items-center gap-1">
            <Button
              v-if="isManager() && !isMobileView"
              variant="ghost"
              class="w-7"
              :tooltip="__('Edit fields layout')"
              :icon="EditIcon"
              @click="openQuickEntryModal"
            />
            <Button
              variant="ghost"
              class="w-7"
              icon="x"
              @click="show = false"
            />
          </div>
        </div>
        <div>
          <!-- <div
            v-if="hasOrganizationSections || hasContactSections"
            class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <div
              v-if="hasOrganizationSections"
              class="flex items-center gap-3 text-sm text-ink-gray-5"
            >
              <div>{{ __('Choose Existing Organization') }}</div>
              <Switch v-model="chooseExistingOrganization" />
            </div>
            <div
              v-if="hasContactSections"
              class="flex items-center gap-3 text-sm text-ink-gray-5"
            >
              <div>{{ __('Choose Existing Contact') }}</div>
              <Switch v-model="chooseExistingContact" />
            </div>
          </div>-->
          <div
            v-if="hasOrganizationSections || hasContactSections"
            class="h-px w-full border-t my-5"
          /> 
          <FieldLayout
            ref="fieldLayoutRef"
            v-if="tabs.data?.length"
            :tabs="tabs.data"
            :data="deal.doc"
            doctype="Smart Task"
          />
          <ErrorMessage class="mt-4" v-if="error" :message="__(error)" />
        </div>
      </div>
      <div class="px-4 pb-7 pt-4 sm:px-6">
        <div class="flex flex-row-reverse gap-2">
          <Button
            variant="solid"
            :label="__('Create')"
            :loading="isDealCreating"
            @click="createDeal"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import EditIcon from '@/components/Icons/EditIcon.vue'
import FieldLayout from '@/components/FieldLayout/FieldLayout.vue'
import { usersStore } from '@/stores/users'
import { statusesStore } from '@/stores/statuses'
import { isMobileView } from '@/composables/settings'
import { showQuickEntryModal, quickEntryProps } from '@/composables/modals'
import { useDocument } from '@/data/document'
import { capture } from '@/telemetry'
import { Switch, createResource } from 'frappe-ui'
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  defaults: Object,
})

const { getUser, isManager } = usersStore()
const { getDealStatus, statusOptions } = statusesStore()

const show = defineModel()
const router = useRouter()
const error = ref(null)

const { document: deal, triggerOnBeforeCreate } = useDocument('Smart Task')

const hasOrganizationSections = ref(true)
const hasContactSections = ref(true)

const isDealCreating = ref(false)
const chooseExistingContact = ref(true)
const chooseExistingOrganization = ref(true)


watch(
  [chooseExistingOrganization, chooseExistingContact],
  ([organization, contact]) => {
    tabs.data.forEach((tab) => {
      tab.sections.forEach((section) => {
        if (section.name === 'organization_section') {
          section.hidden = !organization
        } else if (section.name === 'organization_details_section') {
          section.hidden = organization
        } else if (section.name === 'contact_section') {
          section.hidden = !contact
        } else if (section.name === 'contact_details_section') {
          section.hidden = contact
        }
      })
    })
  },
)

const tabs = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_fields_layout',
  cache: ['QuickEntry', 'Smart Task'],
  params: { doctype: 'Smart Task', type: 'Quick Entry' },
  auto: true,
  transform: (_tabs) => {
    hasOrganizationSections.value = false
    return _tabs.forEach((tab) => {
      tab.sections.forEach((section) => {
        section.columns.forEach((column) => {
          // if (
          //   ['organization_section', 'organization_details_section'].includes(
          //     section.name,
          //   )
          // ) {
          //   hasOrganizationSections.value = true
          // } else if (
          //   ['contact_section', 'contact_details_section'].includes(
          //     section.name,
          //   )
          // ) {
          //   hasContactSections.value = true
          // }
          column.fields.forEach((field) => {
            // if (field.fieldname == 'status') {
            //   field.fieldtype = 'Select'
            //   field.options = dealStatuses.value
            //   field.prefix = getDealStatus(deal.doc.status).color
            // }

            if (field.fieldtype === 'Table') {
              deal.doc[field.fieldname] = []
            }
          })
        })
      })
    })
  },
})

// const dealStatuses = computed(() => {
//   let statuses = statusOptions('deal')
//   if (!deal.doc.status) {
//     deal.doc.status = statuses[0].value
//   }
//   return statuses
// })

async function createDeal() {

  await triggerOnBeforeCreate?.()

  createResource({
    url: 'merabt_crm.portal_api.api.create_new_doc',
    params: { args: deal.doc, doctype: 'Smart Task' },
    auto: true,
    validate() {
      error.value = null
      if (!deal.doc.status) {
        error.value = __('Status is required')
        return error.value
      }
   
      isDealCreating.value = true
    },
    onSuccess(name) {
      capture('task_created')
      
      isDealCreating.value = false
      show.value = false
      router.push({ name: 'Project Task', params: { taskId: name } })
    },
    onError(err) {
      isDealCreating.value = false
      if (!err.messages) {
        error.value = err.message
        return
      }
      error.value = err.messages.join('\n')
    },
  })
}

function openQuickEntryModal() {
  showQuickEntryModal.value = true
  quickEntryProps.value = { doctype: 'Smart Task' }
  nextTick(() => (show.value = false))
}

onMounted(() => {
  // deal.doc = { no_of_employees: '1-10' }
  Object.assign(deal.doc, props.defaults)

  // if (!deal.doc.owner) {
  //   deal.doc.deal_owner = getUser().name
  // }
  // if (!deal.doc.status && dealStatuses.value[0].value) {
  //   deal.doc.status = dealStatuses.value[0].value
  // }
})
</script>
