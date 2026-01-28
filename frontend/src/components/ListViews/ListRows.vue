<template>
  <div class="mx-3 mt-2 h-full overflow-y-auto sm:mx-5" v-if="showGroupedRows">
    <div v-for="group in reactivieRows" :key="group.group">
      <ListGroupHeader :group="group">
        <div
          class="my-2 flex items-center gap-2 text-base font-medium text-ink-gray-8"
        >
          <div>{{ __(group.label) }} -</div>
          <div class="flex items-center gap-1">
            <component v-if="group.icon" :is="group.icon" />
            <div v-if="group.group == ' '" class="text-ink-gray-4">
              {{ __('Empty') }}
            </div>
            <div v-else>{{ group.group }}</div>
          </div>
        </div>
      </ListGroupHeader>
      <ListGroupRows :group="group">
        <!-- Added BG color to New status rows -->
        <ListRow
          v-for="row in group.rows"
          :key="row.name"
          v-slot="{ idx, column, item }"
          :row="row"
          :class="rowIsNew(row) ? 'bg-green-200' : ''"
        >
          <slot v-bind="{ idx, column, item, row }" />
        </ListRow>
      </ListGroupRows>
    </div>
  </div>
  <ListRows
    v-else
    ref="scrollContainer"
    class="mx-3 sm:mx-5"
    @scroll="handleScroll"
  >
  <!-- Added BG color to New status rows -->
    <ListRow
      v-for="row in reactivieRows"
      :key="row.name"
      v-slot="{ idx, column, item }"
      :row="row"
      :class="rowIsNew(row) ? 'bg-green-200' : ''"
    >
      <slot v-bind="{ idx, column, item, row }" />
    </ListRow>
  </ListRows>
</template>

<script setup>
import { useStorage } from '@vueuse/core'
import { ListRows, ListRow, ListGroupHeader, ListGroupRows } from 'frappe-ui'
import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  doctype: {
    type: String,
    default: 'CRM Lead',
  },
})

const reactivieRows = ref(props.rows)

watch(
  () => props.rows,
  (val) => (reactivieRows.value = val),
)

let showGroupedRows = computed(() => {
  return props.rows.every(
    (row) => row.group && row.rows && Array.isArray(row.rows),
  )
})

const scrollPosition = useStorage(`scrollPosition${props.doctype}`, 0)
const scrollContainer = ref(null)

const handleScroll = () => {
  if (scrollContainer.value) {
    scrollPosition.value = scrollContainer.value.$el.scrollTop
  }
}

// Function to check if a row has 'New' status
function rowIsNew(row) {
  const status = row?.status?.label ?? row?.status?.value ?? row?.status
  if (status == null) return false
  return String(status).toLowerCase() === 'new'
}

onBeforeUnmount(() => {
  if (scrollContainer.value) {
    scrollContainer.value.$el.removeEventListener('scroll', handleScroll)
  }
})

onMounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.$el.addEventListener('scroll', handleScroll)
    scrollContainer.value.$el.scrollTop = scrollPosition.value
  }
})
</script>
