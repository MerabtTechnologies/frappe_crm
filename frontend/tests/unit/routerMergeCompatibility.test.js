import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  session: { isLoggedIn: true, user: 'sales@example.test' },
  users: {
    users: { fetched: true },
    isCrmUser: vi.fn(),
    isProjectManager: vi.fn(),
    isAdmin: vi.fn(),
  },
  views: {
    views: { promise: Promise.resolve(), data: [] },
    standardViews: {},
    getDefaultView: vi.fn(),
  },
  call: vi.fn(),
}))
vi.mock('@/stores/session', () => ({ sessionStore: () => mocks.session }))
vi.mock('@/stores/users', () => ({ usersStore: () => mocks.users }))
vi.mock('@/stores/views', () => ({ viewsStore: () => mocks.views }))
vi.mock('frappe-ui', () => ({ call: mocks.call }))

let guard
beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  localStorage.clear()
  mocks.users.isCrmUser.mockReturnValue(true)
  mocks.users.isProjectManager.mockReturnValue(true)
  mocks.users.isAdmin.mockReturnValue(false)
  mocks.views.getDefaultView.mockReturnValue(null)
  mocks.views.standardViews = {}
  mocks.views.views.data = []
  mocks.call.mockResolvedValue(1)
  guard = (await import('@/router')).beforeNavigation
})

async function navigate(name, overrides = {}) {
  const next = vi.fn()
  await guard(
    {
      name,
      params: {},
      query: { filters: 'dashboard-filter' },
      hash: '',
      matched: [{}],
      ...overrides,
    },
    {},
    next,
  )
  expect(next).toHaveBeenCalledTimes(1)
  return next.mock.calls[0][0]
}

describe('merge route contracts', () => {
  it('rejects project routes before resolving saved views or tab preferences', async () => {
    mocks.users.isProjectManager.mockReturnValue(false)
    expect(await navigate('Project')).toEqual({ name: 'Not Permitted Project' })
    expect(await navigate('Projects')).toEqual({
      name: 'Not Permitted Project',
    })
    expect(mocks.views.getDefaultView).not.toHaveBeenCalled()
  })

  it('rejects non-CRM users before resolving default views', async () => {
    mocks.users.isCrmUser.mockReturnValue(false)
    expect(await navigate('Projects')).toEqual({ name: 'Not Permitted' })
    expect(mocks.views.getDefaultView).not.toHaveBeenCalled()
  })

  it.each([
    'Projects',
    'Project Tasks',
    'Quotations',
    'Gammas',
    'Events',
    'Employee Date Requests',
    'Employee Project Assignments',
    'Smart Timesheets',
    'TaskFollowUp',
    'Issues',
  ])(
    'preserves filters while selecting a default custom view for %s',
    async (name) => {
      mocks.views.getDefaultView.mockReturnValue({
        name: 'Custom',
        type: 'kanban',
        is_standard: 0,
      })
      const redirect = await navigate(name)
      expect(redirect).toEqual({
        name,
        params: { viewType: 'kanban' },
        query: { filters: 'dashboard-filter', view: 'Custom' },
      })
      expect(await navigate(name, redirect)).toBeUndefined()
    },
  )

  it('reads standard defaults from the unwrapped Pinia store', async () => {
    mocks.views.standardViews['Smart Project kanban'] = { is_default: 1 }
    expect((await navigate('Projects')).params).toEqual({ viewType: 'kanban' })
  })

  it('does not use a same-named view belonging to another doctype', async () => {
    mocks.views.views.data = [
      { name: 'Other', label: 'Mine', dt: 'CRM Deal', type: 'kanban' },
    ]
    expect(
      await navigate('Projects', { params: { viewType: 'Mine' } }),
    ).toEqual({
      name: 'Projects',
      params: { viewType: 'list' },
      query: { filters: 'dashboard-filter' },
    })
  })

  it('drops invalid home view metadata while retaining filters', async () => {
    mocks.views.getDefaultView.mockReturnValue({
      route_name: 'Removed',
      type: 'kanban',
      name: 'Invalid',
    })
    expect(await navigate('Home')).toEqual({
      name: 'Leads',
      params: { viewType: 'list' },
      query: { filters: 'dashboard-filter' },
    })
  })

  it('preserves query filters through setup redirects', async () => {
    mocks.users.isAdmin.mockReturnValue(true)
    mocks.call.mockResolvedValue(0)
    expect(await navigate('Home')).toEqual({
      name: 'Setup',
      query: { filters: 'dashboard-filter' },
    })
    mocks.call.mockResolvedValue(1)
    expect(await navigate('Setup')).toEqual({
      name: 'Home',
      query: { filters: 'dashboard-filter' },
    })
  })

  it.each([
    ['Notes', '#notes'],
    ['2', '#activity'],
  ])('normalizes legacy core preference %s', async (stored, hash) => {
    localStorage.setItem('lastDealTab', stored)
    const redirect = await navigate('Deal')
    expect(redirect.hash).toBe(hash)
    expect(redirect.query.filters).toBe('dashboard-filter')
    expect(await navigate('Deal', { hash })).toBeUndefined()
  })
})
