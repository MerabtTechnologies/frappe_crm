<template>
  <div class="p-3 bg-surface rounded cursor-pointer shadow-sm" @click="onOpen">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 min-w-0">
        <div class="truncate text-base font-medium flex-1 min-w-0">{{ label(item.title) || label(item.subject) || __('No Title') }}</div>
      </div>
      <div v-if="getUser().name === item.owner" @click.stop>
        <Dropdown class="flex items-center gap-2" :options="getActions(item.name)" variant="ghost" @click.stop.prevent>
          <Button icon="more-horizontal" variant="ghost" />
        </Dropdown>
      </div>
    </div>
    <div class="mt-2 text-sm text-ink-gray-5">
      <div v-if="item.description">
        <TextEditor
          :content="label(item.description)"
          :editable="false"
          editor-class="!prose-sm max-w-none focus:outline-none"
          class="flex-1 max-h-20 overflow-hidden"
        />
      </div>
     
        <Tooltip :text="item.creation?.label">
            <div class="mt-2 truncate text-xs">{{ item.creation?.timeAgo }}</div>
        </Tooltip>
     
    </div>
    <div class="mt-2 flex items-center gap-2">
        <div class="flex gap-2 pe-1 items-center">
          <IssueStatusIcon v-if="item.status" :status="item.status" />
          <div class=" text-sm">{{ item.status }}</div>
        </div>
        <div class="flex gap-2 pe-1 items-center">
            <TaskPriorityIcon v-if="item.priority" :priority="item.priority"/> 
            <div class=" text-sm">{{ item.priority }}</div>
        </div>
        <div class="flex gap-2 items-center bg-gray-200 pt-1 pb-1 px-2 rounded">
            <Avatar v-if="item.assigned_to?.full_name" :image="item.assigned_to.user_image" :label="item.assigned_to.full_name" size="sm" /> 
            <div class=" text-sm">{{ item.issue_type  || "Unknown"}}</div>
        </div>
        
    </div>
    <div class="mt-2 w-full border-t"  v-if="item.reference_docname">
        <Button
            v-if="item.reference_docname"
            variant="outline"
            size="sm"
            class="mt-2 w-full"
            :label="item.reference_doctype == 'CRM Deal' ? __('Deal') : __('Lead')"
            :iconRight="ArrowUpRightIcon"
            @click.stop="onRedirect(item.reference_doctype, item.reference_docname)"
        />
    </div>
    
  </div>
</template>

<script setup>
import IssueStatusIcon from '@/components/Icons/IssueStatusIcon.vue'
import TaskPriorityIcon from '@/components/Icons/TaskPriorityIcon.vue'
import ArrowUpRightIcon from '@/components/Icons/ArrowUpRightIcon.vue'
import { Avatar, Dropdown, TextEditor } from 'frappe-ui'
import { formatDate } from '@/utils'
import { defineProps, defineEmits } from 'vue'
import { usersStore } from '@/stores/users'

const props = defineProps({
  item: { type: Object, required: true },
  actions: { type: Function, required: false },
})
const { getUser } = usersStore()


const emit = defineEmits(['open', 'redirect'])

function label(value) {
  if (value == null) return ''
  return typeof value === 'object' ? value.label : value
}

function onOpen() {
  emit('open', props.item.name)
}

function onRedirect(doctype, docname) {
  emit('redirect', doctype, docname)
}

function getActions(name) {
  return props.actions ? props.actions(name) : []
}
</script>


<!-- Add open task button to show the task details -->