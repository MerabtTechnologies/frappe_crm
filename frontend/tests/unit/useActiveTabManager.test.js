import { computed, effectScope, nextTick, reactive, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  normalizeTabPreference,
  useActiveTabManager as createTabManager,
} from '@/composables/useActiveTabManager'

const scopes = []
function useActiveTabManager(...args) {
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(() => createTabManager(...args))
}

const route = reactive({ hash: '' })
const push = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push }),
}))

beforeEach(() => {
  vi.useFakeTimers()
  route.hash = ''
  push.mockClear()
  localStorage.clear()
})

afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop())
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('custom activity tab contracts', () => {
  const tabs = computed(() => [
    { name: 'Activity', value: 'activity' },
    { name: 'Project Tasks', value: 'project-tasks' },
    { name: 'Notes', value: 'notes' },
  ])

  it('migrates a valid legacy name once into a separate family key', async () => {
    localStorage.setItem('lastDealTab', 'Project Tasks')
    const project = useActiveTabManager(tabs, 'lastProjectTab', 'lastDealTab')
    expect(project.activeTab.value).toBe('project-tasks')
    project.changeTabTo('notes')
    await nextTick()
    await vi.advanceTimersByTimeAsync(350)
    expect(localStorage.getItem('lastProjectTab')).toBe('notes')
    expect(localStorage.getItem('lastDealTab')).toBe('Project Tasks')
    const revisited = useActiveTabManager(tabs, 'lastProjectTab', 'lastDealTab')
    expect(revisited.activeTab.value).toBe('notes')
  })

  it('does not overwrite a custom family preference with a legacy value', () => {
    localStorage.setItem('lastDealTab', 'notes')
    localStorage.setItem('lastProjectTab', 'project-tasks')
    expect(
      useActiveTabManager(tabs, 'lastProjectTab', 'lastDealTab').activeTab
        .value,
    ).toBe('project-tasks')
  })

  it.each(['2', 'erpnext-quotations', null])(
    'rejects incompatible legacy preference %s',
    (value) => {
      if (value !== null) localStorage.setItem('lastDealTab', value)
      expect(
        useActiveTabManager(tabs, 'lastProjectTab', 'lastDealTab').activeTab
          .value,
      ).toBe('activity')
    },
  )

  it('restores custom hashes and preserves query filters when switching', async () => {
    route.hash = '#project-tasks'
    route.query = { filters: '{"status":"Open"}' }
    const { activeTab, changeTabTo } = useActiveTabManager(
      tabs,
      'lastProjectTab',
    )
    expect(activeTab.value).toBe('project-tasks')
    changeTabTo('notes')
    await nextTick()
    expect(push).toHaveBeenLastCalledWith({ ...route, hash: '#notes' })
    delete route.query
  })

  it('falls back when a condition removes the selected tab', async () => {
    const visible = ref([
      { value: 'activity' },
      { value: 'erpnext-quotations' },
    ])
    route.hash = '#erpnext-quotations'
    const { activeTab } = useActiveTabManager(visible, 'lastDealTab')
    visible.value = [{ value: 'activity' }]
    await nextTick()
    expect(activeTab.value).toBe('activity')
  })

  it('does not confuse custom quotations with integration quotations', () => {
    const quotations = [
      { name: 'Quotations', value: 'quotations' },
      { name: 'ERPNext Quotations', value: 'erpnext-quotations' },
    ]
    expect(normalizeTabPreference('Quotations', quotations)).toBe('quotations')
    expect(normalizeTabPreference('ERPNext Quotations', quotations)).toBe(
      'erpnext-quotations',
    )
  })
})

describe('useActiveTabManager with every tab hidden', () => {
  it('does not throw or navigate', async () => {
    localStorage.setItem('lastDealTab', 'comments')
    const { activeTab } = useActiveTabManager(
      computed(() => []),
      'lastDealTab',
    )
    activeTab.value = 'emails'
    route.hash = '#emails'
    await expect(nextTick()).resolves.not.toThrow()
    expect(push).not.toHaveBeenCalled()
  })
})

describe('useActiveTabManager with a note link', () => {
  const tabs = computed(() => [{ value: 'activity' }, { value: 'notes' }])

  it('opens the notes tab and keeps the note in the url', async () => {
    route.hash = '#notes/gbp2a9uafp'
    const { activeTab } = useActiveTabManager(tabs, 'lastDealTab')
    await nextTick()
    expect(activeTab.value).toBe('notes')
    expect(push).not.toHaveBeenCalled()
  })

  it('switches to the notes tab when the link opens on the same page', async () => {
    const { activeTab } = useActiveTabManager(tabs, 'lastDealTab')
    route.hash = '#notes/gbp2a9uafp'
    await nextTick()
    await nextTick()
    expect(activeTab.value).toBe('notes')
    expect(push).not.toHaveBeenCalled()
  })
})
