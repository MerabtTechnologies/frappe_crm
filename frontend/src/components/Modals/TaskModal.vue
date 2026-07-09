<template>
  <DoctypeModal
    v-if="show"
    v-model="show"
    doctypeTitle="Task"
    doctype="CRM Task"
    :docname="task?.name || ''"
    :defaults="modalDefaults"
    @afterInsert="handleAfterInsert"
    @afterUpdate="handleAfterUpdate"
  />
</template>

<script setup>
import DoctypeModal from '@/components/Modals/DoctypeModal.vue'
import { computed } from 'vue'

const props = defineProps({
  task: { type: Object, default: () => ({}) },
  doctype: { type: String, default: '' },
  doc: { type: String, default: '' },
})

const show = defineModel({ type: Boolean, default: false })
const reloadTasks = defineModel('reloadTasks', { type: Object, default: null })

const emit = defineEmits(['after'])

const modalDefaults = computed(() => ({
  ...props.task,
  reference_doctype: props.doctype || props.task?.reference_doctype || '',
  reference_docname: props.doc || props.task?.reference_docname || '',
}))

function reloadBoundList() {
  reloadTasks.value?.reload?.()
}

function handleAfterInsert(document) {
  reloadBoundList()
  emit('after', document)
}

function handleAfterUpdate(document) {
  reloadBoundList()
  emit('after', document)
}
</script>
