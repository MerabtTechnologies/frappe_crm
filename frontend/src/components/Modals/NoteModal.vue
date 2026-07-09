<template>
  <DoctypeModal
    v-if="show"
    v-model="show"
    doctypeTitle="Note"
    doctype="FCRM Note"
    :docname="note?.name || ''"
    :defaults="modalDefaults"
    @afterInsert="handleAfterInsert"
    @afterUpdate="handleAfterUpdate"
  />
</template>

<script setup>
import DoctypeModal from '@/components/Modals/DoctypeModal.vue'
import { computed } from 'vue'

const props = defineProps({
  note: { type: Object, default: () => ({}) },
  doctype: { type: String, default: '' },
  doc: { type: String, default: '' },
})

const show = defineModel({ type: Boolean, default: false })
const reloadNotes = defineModel('reloadNotes', { type: Object, default: null })

const emit = defineEmits(['after'])

const modalDefaults = computed(() => ({
  ...props.note,
  reference_doctype: props.doctype || props.note?.reference_doctype || '',
  reference_docname: props.doc || props.note?.reference_docname || '',
}))

function reloadBoundList() {
  reloadNotes.value?.reload?.()
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
