import { createResource } from 'frappe-ui'
import { computed, ref, watch } from 'vue'
import {
  callEnabled,
  defaultCallingMedium,
  useTelephony,
} from '@/composables/telephony'
import { whatsappEnabled, isWhatsappInstalled } from '@/composables/whatsapp'

export {
  callEnabled,
  defaultCallingMedium,
  isWhatsappInstalled,
  useTelephony,
  whatsappEnabled,
}

export const merabtCallEnabled = ref(false)
export const merabtCallSettings = ref({})

createResource({
  url: '/api/method/merabt_crm.portal_api.voice_call.get_voice_call_settings',
  cache: 'Merabt Call Integration Enabled',
  auto: true,
  onSuccess: (data) => {
    const response = data?.message ?? data
    const payload = response?.settings ?? response ?? {}
    merabtCallEnabled.value = Boolean(payload.enable_call == 1)
    merabtCallSettings.value = payload || {}
  },
})

export const merabtNewLeadColour = ref(false)
export const merabtSettings = ref({})

createResource({
  url: '/api/method/merabt_crm.portal_api.api.get_merabt_settings',
  cache: 'Merabt Settingss',
  auto: true,
  onSuccess: (data) => {
    const response = data?.message ?? data
    const payload = response?.settings ?? response ?? {}
    merabtNewLeadColour.value = Boolean(payload.enable_new_lead_colour == 1)
    merabtSettings.value = payload || {}
  },
})

export const mobileSidebarOpened = ref(false)

let afterMobileSidebarClosed = null

// A callback whose close never finished (drawer unmounted mid-transition)
// must not fire on a later, unrelated close.
watch(mobileSidebarOpened, (opened) => {
  if (opened) afterMobileSidebarClosed = null
})

// The drawer traps focus until its leave transition ends, so anything that
// needs focus (like a dialog) must wait for it to be gone.
export function closeMobileSidebar(then) {
  if (!mobileSidebarOpened.value) return then?.()
  afterMobileSidebarClosed = then
  mobileSidebarOpened.value = false
}

export function onMobileSidebarClosed() {
  afterMobileSidebarClosed?.()
  afterMobileSidebarClosed = null
}

export const isMobileView = computed(() => window.innerWidth < 768)

export const showSettings = ref(false)

export const disableSettingModalOutsideClick = ref(false)

export const activeSettingsPage = ref('')
