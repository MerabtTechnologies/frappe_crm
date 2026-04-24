import { defineStore } from 'pinia'
import { createResource } from 'frappe-ui'
import { reactive, ref } from 'vue'

export const merabtStore = defineStore('crm-merabt-store', () => {
  const showModal = ref(false)

  const modelData = reactive({
  title: 'Welcome to M Nova CRM',
  message: 'Welcome to M Nova CRM! We are excited to have you on board. Explore the features and let us know if you have any questions.',
  type: 'good',
  buttons: [
        // { label: 'Update Now', action: updateNow },
        { label: 'Close', action: () => (showModal.value = false) },
    ],
  })

  function changeModelData( title, message, type) {
    modelData.title = title
    modelData.message = message
    modelData.type = type
    modelData.buttons = [
      { label: 'Close', action: () => (showModal.value = false) },
    ]
  }

  function changeModel(value) {
    showModal.value = value
  }

  return {
    modelData,
    showModal,
    changeModelData,
    changeModel,
  }
})