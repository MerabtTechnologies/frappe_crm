import { createResource } from 'frappe-ui'
import { computed, ref } from 'vue'
import { callEnabled } from '@/composables/telephony'
import { whatsappEnabled, isWhatsappInstalled } from '@/composables/whatsapp'

// Backward-compatible exports used across existing pages.
export { callEnabled, whatsappEnabled, isWhatsappInstalled }

export const merabtCallEnabled = ref(false)
export const merabtCallSettings = ref({})

createResource({
  url: 'merabt_crm.portal_api.voice_call.get_voice_call_settings',
  cache: 'Merabt Call Integration Enabled',
  auto: true,
  onSuccess: (data) => {
    merabtCallEnabled.value = Boolean(data.settings.enable_call == 1)
    merabtCallSettings.value = data.settings || {}
  },
})

export const merabtNewLeadColour = ref(false)
export const merabtSettings = ref({})

createResource({
  url: 'merabt_crm.portal_api.api.get_merabt_settings',
  cache: 'Merabt Settingss',
  auto: true,
  onSuccess: (data) => {
    merabtNewLeadColour.value = Boolean(data.settings.enable_new_lead_colour == 1)
    merabtSettings.value = data.settings || {}
  },
})
export const mobileSidebarOpened = ref(false)

export const isMobileView = computed(() => window.innerWidth < 768)

export const showSettings = ref(false)

export const disableSettingModalOutsideClick = ref(false)

export const activeSettingsPage = ref('')
