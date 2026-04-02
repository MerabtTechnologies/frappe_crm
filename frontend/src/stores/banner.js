import { defineStore } from 'pinia'
import { ref } from 'vue'

export const bannerStore = defineStore('crm-banner', () => {
  const visible = ref(false)
  const message = ref('')
  const STORAGE_KEY = 'crm_banner'

  // initialize from localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.message) {
        message.value = parsed.message
      }
      // only restore visible if not dismissed
      if (parsed && parsed.dismissed !== true) {
        visible.value = !!parsed.visible
      }
    }
  } catch (e) {
    // ignore
  }

  function showBanner(msg) {
    message.value = msg || ''
    visible.value = true
    // debug: log when banner is shown
    try {
      // eslint-disable-next-line no-console
      console.debug('[banner] showBanner:', message.value)
    } catch (e) {}
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ message: message.value, visible: true, dismissed: false }),
      )
    } catch (e) {
      // ignore
    }
  }

  function closeBanner() {
    visible.value = false
    try {
      // eslint-disable-next-line no-console
      console.debug('[banner] closeBanner')
    } catch (e) {}
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ message: message.value, visible: false, dismissed: true }),
      )
    } catch (e) {
      // ignore
    }
  }

  return {
    visible,
    message,
    showBanner,
    closeBanner,
  }
})
