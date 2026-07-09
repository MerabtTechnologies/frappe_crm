import { createResource } from 'frappe-ui'
import { computed, ref } from 'vue'
import {
  callEnabled,
  defaultCallingMedium,
  useTelephony,
} from '@/composables/telephony'
import {
  whatsappEnabled,
  isWhatsappInstalled,
} from '@/composables/whatsapp'

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
  onSuccess: ({message}) => {
    const payload = (message && message.settings) ? message.settings : (message || {})
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
  onSuccess: ({message}) => {
    const payload = (message && message.settings) ? message.settings : (message || {})
    merabtNewLeadColour.value = Boolean(
      payload.enable_new_lead_colour == 1,
    )
    merabtSettings.value = payload || {}
  },
})

export const mobileSidebarOpened = ref(false)

export const isMobileView = computed(() => window.innerWidth < 768)

export const showSettings = ref(false)

export const disableSettingModalOutsideClick = ref(false)

export const activeSettingsPage = ref('')
