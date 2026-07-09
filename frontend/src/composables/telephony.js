import { createResource } from 'frappe-ui'
import { computed, ref } from 'vue'

const integrations = ref({})
export const defaultCallingMedium = ref('')
export const callEnabled = ref(false)

createResource({
  url: '/api/method/crm.integrations.api.is_call_integration_enabled',
  cache: 'Is Call Integration Enabled',
  auto: true,
  onSuccess: ({message}) => {
    const payload = (message && message.integrations) ? message : (message || {})
    integrations.value = payload.integrations || {}
    defaultCallingMedium.value = payload.default_calling_medium || ''
    callEnabled.value = Object.values(integrations.value).some(Boolean)
  },
})

export function setEnabled(name, value) {
  integrations.value[name] = value
  callEnabled.value = Object.values(integrations.value).some(Boolean)
}

export function useTelephony() {
  const allIntegrations = computed(() =>
    Object.entries(integrations.value).map(([name, enabled]) => ({
      name,
      enabled,
    })),
  )

  function isEnabled(name) {
    return Boolean(integrations.value[name])
  }

  const isAnyEnabled = computed(() =>
    Object.values(integrations.value).some(Boolean),
  )

  return { integrations: allIntegrations, isEnabled, isAnyEnabled }
}
