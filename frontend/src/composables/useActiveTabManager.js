import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn, useStorage } from '@vueuse/core'
import { parseActivityHash } from '@/utils/activityHash'

export function normalizeTabPreference(value, tabs) {
  const direct = tabs.find((tab) => tab.value === value)
  if (direct) return direct.value
  if (typeof value !== 'string') return undefined
  const named = tabs.find(
    (tab) => tab.name?.toLowerCase() === value.toLowerCase(),
  )
  return named?.value
}

export function useActiveTabManager(tabs, storageKey, legacyStorageKey) {
  let initialTab = 'activity'
  if (legacyStorageKey) {
    try {
      const storage = window.localStorage
      if (storage.getItem(storageKey) === null) {
        initialTab =
          normalizeTabPreference(
            storage.getItem(legacyStorageKey),
            tabs.value || [],
          ) || initialTab
      }
    } catch {
      // Storage can be unavailable in private browsing.
    }
  }
  const lastVisitedTab = useStorage(storageKey, initialTab)
  const route = useRoute()
  const router = useRouter()

  const changeTabTo = (tabName) => {
    if (!hasTab(tabName)) return
    activeTab.value = tabName
  }

  const preserveLastVisitedTab = useDebounceFn((tabName) => {
    lastVisitedTab.value = tabName
  }, 300)

  function setActiveTabInUrl(tabName) {
    if (getActiveTabFromUrl() === tabName) return
    router.push({ ...route, hash: '#' + tabName })
  }

  function getActiveTabFromUrl() {
    return parseActivityHash(route.hash).tab
  }

  function hasTab(tabName) {
    return tabs.value?.some((tab) => tab.value === tabName)
  }

  function firstTab() {
    return tabs.value?.[0]?.value
  }

  function getActiveTab() {
    let _activeTab = getActiveTabFromUrl()
    if (_activeTab) {
      if (hasTab(_activeTab)) {
        preserveLastVisitedTab(_activeTab)
        return _activeTab
      }
      return firstTab()
    }

    const storedTab = normalizeTabPreference(
      lastVisitedTab.value,
      tabs.value || [],
    )
    if (storedTab) return storedTab

    return firstTab()
  }

  const activeTab = ref(getActiveTab())

  watch(activeTab, (tabName) => {
    if (!hasTab(tabName)) return
    setActiveTabInUrl(tabName)
    preserveLastVisitedTab(tabName)
  })

  watch(
    () => route.hash,
    (tabValue) => {
      if (!tabValue) return

      let tabName = parseActivityHash(tabValue).tab
      if (!hasTab(tabName)) tabName = firstTab()

      if (tabName) preserveLastVisitedTab(tabName)
      activeTab.value = tabName
    },
  )

  watch(tabs, () => {
    activeTab.value = getActiveTab()
  })

  return { activeTab, changeTabTo }
}
