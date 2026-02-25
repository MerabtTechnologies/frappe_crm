<template>
  <div class="p-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- <div class="text-sm text-ink-gray-6">
        <div class="font-medium text-ink-gray-9">{{ __('Created By') }}</div>
        <div>{{ createdByName }}</div>
      </div> -->

      <div class="text-sm text-ink-gray-6">
        <div class="font-medium text-ink-gray-9">{{ __('Owner') }}</div>
        <div>{{ owner }}</div>
      </div>
      
      <div class="text-sm text-ink-gray-6">
        <div class="font-medium text-ink-gray-9">{{ __('Created On') }}</div>
        <div>{{ createdOn }}</div>
      </div>
    
      <div class="text-sm text-ink-gray-6">
        <div class="font-medium text-ink-gray-9">{{ __('Modified By') }}</div>
        <div>{{ modifiedByName }}</div>
      </div>

      <div class="text-sm text-ink-gray-6">
        <div class="font-medium text-ink-gray-9">{{ __('Modified On') }}</div>
        <div>{{ modifiedOn }}</div>
      </div>

      

      <!-- <div class="text-sm text-ink-gray-6">
        <div class="font-medium text-ink-gray-9">{{ __('Docstatus') }}</div>
        <div>{{ docstatusLabel }}</div>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { inject, computed } from 'vue'
import { getFormat } from '@/utils'
import { usersStore } from '@/stores/users'

const data = inject('data')
const doctype = inject('doctype')

const { getUser } = usersStore()

const doc = computed(() => data.value || {})

const createdByName = computed(() => {
  return (doc.value.created_by && getUser(doc.value.created_by)?.full_name) || doc.value.created_by || 'N/A'
})

const modifiedByName = computed(() => {
  return (doc.value.modified_by && getUser(doc.value.modified_by)?.full_name) || doc.value.modified_by || 'N/A'
})

const createdOn = computed(() => {
  return doc.value.creation ? getFormat(doc.value.creation, 'ddd, MMM D, YYYY h:mm a', true, true, true) : 'N/A'
})

const modifiedOn = computed(() => {
  return doc.value.modified ? getFormat(doc.value.modified, 'ddd, MMM D, YYYY h:mm a', true, true, true) : 'N/A'
})

const owner = computed(() => doc.value.owner || '')

const docstatusLabel = computed(() => {
  const ds = Number(doc.value.docstatus)
  if (ds === 1) return 'Submitted'
  if (ds === 2) return 'Cancelled'
  return 'Draft'
})
</script>

<style scoped>
.font-medium {
  font-weight: 600;
}
</style>
