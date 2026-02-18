<template>
  <div
    class="flex flex-col"
    :class="{
      'border border-outline-gray-1 rounded-lg': hasTabs,
      'border-outline-gray-modals': hasTabs,
    }"
  >
    <Tabs
      as="div"
      v-model="tabIndex"
      :tabs="tabsUsed"
      :class="!hasTabs ? `[&_[role='tablist']]:hidden` : ''"
    >
      <template #tab-panel="{ tab }">
        <div
          class="sections overflow-hidden"
          :class="{ 'my-4 sm:my-5': hasTabs }"
        >
          <template v-if="tab.label === 'Meta Info'">
            <MetaInfo />
          </template>
          <template v-else-if="tab.id === 'additional_data'">
            <div class="sections overflow-hidden my-4 sm:my-5">
              <div class="p-4">
                <div v-if="formattedCustomFields.length" class="flex flex-col gap-2">
                  <div
                    v-for="item in formattedCustomFields"
                    :key="item.k + item.v"
                    class="flex justify-between items-start gap-4 py-2 border-b border-outline-gray-1"
                  >
                    <div class="w-2/5 text-sm font-medium text-ink-gray-6 break-words">
                      {{ item.k }}
                    </div>
                    <div class="w-3/5 text-sm break-words text-ink-gray-8">
                      {{ item.v }}
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-ink-gray-5">{{ __('No custom fields') }}</div>
              </div>
            </div>
          </template>
          <template v-else>
            <template v-for="section in tab.sections" :key="section.name">
              <Section :section="section" :data-name="section.name" />
            </template>
          </template>
        </div>
      </template>
    </Tabs>
  </div>
</template>

<script setup>
import Section from '@/components/FieldLayout/Section.vue'
import MetaInfo from '@/components/FieldLayout/MetaInfo.vue'
import { Tabs } from 'frappe-ui'
import { ref, computed, provide } from 'vue'

// translation helper (safe fallback)
const __ = typeof window !== 'undefined' && window.__ ? window.__ : (s) => s

const props = defineProps({
  tabs: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  doctype: {
    type: String,
    default: 'CRM Lead',
  },
  isGridRow: {
    type: Boolean,
    default: false,
  },
  preview: {
    type: Boolean,
    default: false,
  },
  rowReadOnly: {
    type: Boolean,
    default: false,
  },
})

const tabIndex = ref(0)

const hasTabs = computed(() => {
  const baseHas = props.tabs.length > 1 || (props.tabs.length == 1 && props.tabs[0].label)
  const raw = props.data?.custom_custom_form_questions
  const hasCustom = raw !== undefined && raw !== null && String(raw).trim() !== ''
  return baseHas || hasCustom
})

provide('data', computed(() => props.data))
provide('hasTabs', hasTabs)
provide('doctype', props.doctype)
provide('preview', props.preview)
provide('isGridRow', props.isGridRow)
provide('rowReadOnly', props.rowReadOnly)

const tabsUsed = computed(() => {
  const base = Array.isArray(props.tabs) ? [...props.tabs] : []
  const raw = props.data?.custom_custom_form_questions
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    base.push({ id: 'additional_data', label: __( 'Additional Data' ), sections: [] })
  }
  return base
})

const formattedCustomFields = computed(() => {
  const raw = props.data?.custom_custom_form_questions
  if (raw === undefined || raw === null || String(raw).trim() === '') return []

  if (typeof raw === 'object') {
    return Object.entries(raw).map(([k, v]) => ({ k, v }))
  }

  const s = String(raw).trim()

  // Try JSON parse first
  try {
    const parsed = JSON.parse(s)
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).map(([k, v]) => ({ k, v }))
    }
  } catch (e) {
    // try a heuristic: replace single quotes with double quotes and parse
    try {
      const fixed = s.replace(/'/g, '"')
      const parsed2 = JSON.parse(fixed)
      if (parsed2 && typeof parsed2 === 'object') {
        return Object.entries(parsed2).map(([k, v]) => ({ k, v }))
      }
    } catch (e2) {
      // fall through to line parsing
    }
  }

  const items = []
  const lines = s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && l !== 'custom_custom_form_questions')

  for (const line of lines) {
    const idx = line.indexOf(':')
    if (idx > -1) {
      const key = line.slice(0, idx).trim()
      const val = line.slice(idx + 1).trim()
      // handle flow_data or comma-separated key:value pairs
      if ((key === 'flow_data' || val.includes(':')) && val.includes(',')) {
        const parts = val.split(/\s*,\s*/)
        for (const p of parts) {
          const pi = p.indexOf(':')
          if (pi > -1) {
            const kk = p.slice(0, pi).trim()
            const vv = p.slice(pi + 1).trim()
            items.push({ k: kk, v: vv })
          } else {
            items.push({ k: key, v: p.trim() })
          }
        }
      } else {
        items.push({ k: key, v: val })
      }
    } else if (line.includes(',')) {
      const parts = line.split(/\s*,\s*/)
      for (const p of parts) {
        const pi = p.indexOf(':')
        if (pi > -1) {
          items.push({ k: p.slice(0, pi).trim(), v: p.slice(pi + 1).trim() })
        } else {
          items.push({ k: p.trim(), v: '' })
        }
      }
    } else {
      items.push({ k: line, v: '' })
    }
  }

  return items
})
</script>
<style scoped>
.section:not(:has(.field)) {
  display: none;
}

.section:has(.field):nth-child(1 of .section:has(.field)) {
  border-top: none;
  margin-top: 0;
  padding-top: 0;
}
</style>
