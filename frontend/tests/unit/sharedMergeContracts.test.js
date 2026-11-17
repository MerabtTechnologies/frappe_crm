import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse, compileScript } from '@vue/compiler-sfc'
import { computed, ref, unref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Execute the actual component handlers with isolated resources, without network or UI writes.
function handlers(path, names, context) {
  const source = readFileSync(
    resolve(import.meta.dirname, '../../src', path),
    'utf8',
  )
  const { descriptor } = parse(source)
  const { scriptSetupAst } = compileScript(descriptor, { id: path })
  const declarations = scriptSetupAst.filter(
    (node) =>
      node.type === 'FunctionDeclaration' && names.includes(node.id.name),
  )
  expect(declarations).toHaveLength(names.length)
  const code = declarations
    .map((node) => descriptor.scriptSetup.content.slice(node.start, node.end))
    .join('\n')
  return new Function(
    ...Object.keys(context),
    `${code}; return { ${names.join(',')} }`,
  )(...Object.values(context))
}

describe('notification service worker readiness', () => {
  const workerUrl =
    'https://crm.example.test/assets/crm/frontend/firebase-messaging-sw.js'

  function setup(registration) {
    const navigator = {
      serviceWorker: { register: vi.fn().mockResolvedValue(registration) },
    }
    return {
      navigator,
      ...handlers('App.vue', ['getMessagingRegistration'], { navigator }),
    }
  }

  afterEach(() => vi.useRealTimers())

  it('uses the CRM worker with a separate push scope and an active registration', async () => {
    const registration = { active: { state: 'activated' } }
    const { navigator, getMessagingRegistration } = setup(registration)
    await expect(getMessagingRegistration(workerUrl)).resolves.toBe(
      registration,
    )
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith(workerUrl, {
      scope: '/assets/crm/frontend/firebase-cloud-messaging-push-scope',
    })
  })

  it('waits for activation before allowing push subscription', async () => {
    const worker = Object.assign(new EventTarget(), { state: 'installing' })
    const removeListener = vi.spyOn(worker, 'removeEventListener')
    const registration = { installing: worker }
    const { getMessagingRegistration } = setup(registration)
    const ready = vi.fn()
    const result = getMessagingRegistration(workerUrl).then(ready)
    await Promise.resolve()
    expect(ready).not.toHaveBeenCalled()
    worker.state = 'activated'
    worker.dispatchEvent(new Event('statechange'))
    await result
    expect(ready).toHaveBeenCalledWith(registration)
    expect(removeListener).toHaveBeenCalledWith(
      'statechange',
      expect.any(Function),
    )
  })

  it('rejects a failed worker and cleans up its listener', async () => {
    const worker = Object.assign(new EventTarget(), { state: 'installing' })
    const removeListener = vi.spyOn(worker, 'removeEventListener')
    const { getMessagingRegistration } = setup({ installing: worker })
    const result = getMessagingRegistration(workerUrl)
    const rejected = expect(result).rejects.toThrow('failed to activate')
    await Promise.resolve()
    worker.state = 'redundant'
    worker.dispatchEvent(new Event('statechange'))
    await rejected
    expect(removeListener).toHaveBeenCalled()
  })

  it('bounds activation waits and removes abandoned listeners', async () => {
    vi.useFakeTimers()
    const worker = Object.assign(new EventTarget(), { state: 'installing' })
    const removeListener = vi.spyOn(worker, 'removeEventListener')
    const { getMessagingRegistration } = setup({ installing: worker })
    const result = getMessagingRegistration(workerUrl)
    const rejected = expect(result).rejects.toThrow('activation timed out')
    await vi.advanceTimersByTimeAsync(10000)
    await rejected
    expect(removeListener).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('rejects registrations that have no worker', async () => {
    const { getMessagingRegistration } = setup({})
    await expect(getMessagingRegistration(workerUrl)).rejects.toThrow(
      'unavailable',
    )
  })

  it.each([
    ['messaging/token-unsubscribe-failed', ''],
    ['messaging/token-subscribe-failed', ''],
    ['messaging/failed-service-worker-registration', ''],
    ['', 'Request failed: Permission denied'],
    ['', 'Application has been suspended'],
    ['', 'push service not available'],
  ])('treats environmental push failure as a warning: %s %s', (code, msg) => {
    const { isIgnorableFcmError } = handlers(
      'App.vue',
      ['isIgnorableFcmError'],
      {},
    )
    expect(isIgnorableFcmError(code, msg)).toBe(true)
  })

  it('still surfaces actionable notification errors', () => {
    const { isIgnorableFcmError } = handlers(
      'App.vue',
      ['isIgnorableFcmError'],
      {},
    )
    expect(isIgnorableFcmError('messaging/permission-blocked', '')).toBe(false)
    expect(isIgnorableFcmError('', 'Unknown server failure')).toBe(false)
  })
})

function chart(name, editing = false, user = 'Sales User') {
  const context = {
    props: { item: { name }, editing },
    filters: ref({ user }),
    fromDate: ref('2026-01-01'),
    toDate: ref('2026-01-31'),
    unref,
    router: { push: vi.fn() },
    userEmailCache: {},
    getUserEmailFromName: vi.fn().mockResolvedValue('sales@example.test'),
  }
  return {
    ...handlers(
      'components/Dashboard/DashboardItem.vue',
      [
        'handleChartClick',
        'handleEChartClick',
        'handleAxisChartClick',
        'applyUserFilter',
      ],
      context,
    ),
    context,
  }
}

function lastFilters(context) {
  return JSON.parse(context.router.push.mock.lastCall[0].query.filters)
}

describe('dashboard click navigation', () => {
  it('retains date, owner and status filters for number cards', async () => {
    const { handleChartClick, context } = chart('open_leads')
    await handleChartClick()
    expect(context.router.push.mock.lastCall[0].name).toBe('Leads')
    expect(lastFilters(context)).toEqual(
      expect.arrayContaining([
        { fieldname: 'status', condition: 'equals', value: 'Open' },
        {
          fieldname: 'creation',
          condition: 'between',
          value: ['2026-01-01', '2026-01-31'],
        },
        {
          fieldname: 'lead_owner',
          condition: 'equals',
          value: 'sales@example.test',
        },
      ]),
    )
  })

  it.each([
    ['total_incoming_call_logs_count', 'receiver'],
    ['total_outgoing_call_logs_count', 'caller'],
    ['total_call_logs_count', 'call_participant'],
  ])('uses the matching participant for %s', async (name, field) => {
    const { handleChartClick, context } = chart(name)
    await handleChartClick()
    expect(context.router.push.mock.lastCall[0].name).toBe('Call Logs')
    expect(lastFilters(context)).toContainEqual({
      fieldname: field,
      condition: 'equals',
      value: 'sales@example.test',
    })
  })

  it('preserves custom donut segment navigation', async () => {
    const { handleEChartClick, context } = chart('deals_by_source')
    await handleEChartClick({ name: 'Empty' })
    expect(lastFilters(context)).toContainEqual({
      fieldname: 'source',
      condition: 'is',
      value: 'not set',
    })
  })

  it('preserves custom axis segment navigation', async () => {
    const { handleAxisChartClick, context } = chart('deals_by_territory')
    await handleAxisChartClick({ territory: 'West' })
    expect(lastFilters(context)).toContainEqual(
      expect.objectContaining({ fieldname: 'territory', value: 'West' }),
    )
  })

  it('never navigates while editing charts', async () => {
    const {
      handleChartClick,
      handleEChartClick,
      handleAxisChartClick,
      context,
    } = chart('open_leads', true)
    await handleChartClick()
    await handleEChartClick({ name: 'Open' })
    await handleAxisChartClick({ territory: 'West' })
    expect(context.router.push).not.toHaveBeenCalled()
    expect(context.getUserEmailFromName).not.toHaveBeenCalled()
  })
})

describe('explicit view saves', () => {
  function view() {
    const listResource = { params: {}, reload: vi.fn() }
    const context = {
      defaultParams: ref({ filters: {}, view: {} }),
      viewUpdated: ref(false),
      view: ref({}),
      listResource,
      list: ref(listResource),
      route: { name: 'Projects', query: {}, params: {} },
      props: { doctype: 'Smart Project' },
      getParams: () => ({ filters: {}, view: {} }),
      createOrUpdateStandardView: vi.fn(),
      persistCustomView: vi.fn(),
      localStorage,
      viewModalObj: ref({}),
      showViewModal: ref(false),
      savingView: ref(false),
    }
    return {
      context,
      ...handlers(
        'components/ViewControls.vue',
        [
          'updateFilter',
          'updateSort',
          'updateGroupBy',
          'updateColumns',
          'saveView',
          'unsavedKey',
          'saveUnsaved',
          'readUnsaved',
          'clearUnsaved',
        ],
        context,
      ),
    }
  }

  it('does not persist temporary filters through sort, grouping or column changes', () => {
    const api = view()
    api.updateFilter({ status: 'Open' })
    api.updateSort('creation asc')
    api.updateGroupBy('owner')
    api.updateColumns({
      columns: [{ key: 'name' }],
      rows: ['name'],
      reload: true,
    })
    expect(api.context.viewUpdated.value).toBe(true)
    expect(api.context.defaultParams.value.filters).toEqual({ status: 'Open' })
    expect(api.context.createOrUpdateStandardView).not.toHaveBeenCalled()
    expect(api.context.persistCustomView).not.toHaveBeenCalled()
    api.saveView()
    expect(api.context.createOrUpdateStandardView).toHaveBeenCalledOnce()
  })

  it('opens confirmation for a named view rather than silently saving it', () => {
    const api = view()
    api.context.route.query.view = 'My Projects'
    api.updateFilter({ owner: '@me' })
    api.saveView()
    expect(api.context.showViewModal.value).toBe(true)
    expect(api.context.viewModalObj.value.mode).toBe('edit')
    expect(api.context.createOrUpdateStandardView).not.toHaveBeenCalled()
  })

  it('isolates unsaved preferences by route, doctype, view and type', () => {
    localStorage.clear()
    const api = view()
    const originalKey = api.unsavedKey()
    api.saveUnsaved({ filters: { status: 'Open' } })
    expect(api.readUnsaved().filters.status).toBe('Open')
    api.context.route.query.view = 'Another'
    expect(api.unsavedKey()).not.toBe(originalKey)
    expect(api.readUnsaved()).toBeNull()
    delete api.context.route.query.view
    api.clearUnsaved()
    expect(api.readUnsaved()).toBeNull()
  })
})

describe('standard view save completion', () => {
  function standardView() {
    const context = {
      route: { query: {} },
      props: { doctype: 'Smart Project' },
      view: ref({ filters: { status: 'Open' } }),
      savingView: ref(false),
      viewUpdated: ref(true),
      unsavedKey: vi.fn().mockReturnValue('projects'),
      clearUnsaved: vi.fn(),
      call: vi.fn().mockResolvedValue({}),
      reloadViewAfterSave: vi.fn().mockResolvedValue(),
      toast: { error: vi.fn() },
      __: (text) => text,
    }
    return {
      context,
      ...handlers(
        'components/ViewControls.vue',
        ['createOrUpdateStandardView'],
        context,
      ),
    }
  }

  it('clears only the state that was successfully saved', async () => {
    const api = standardView()
    await api.createOrUpdateStandardView()
    expect(api.context.call.mock.lastCall[1].view).toEqual({
      doctype: 'Smart Project',
      filters: { status: 'Open' },
    })
    expect(api.context.clearUnsaved).toHaveBeenCalledOnce()
    expect(api.context.viewUpdated.value).toBe(false)
    expect(api.context.savingView.value).toBe(false)
  })

  it('preserves edits made during a save and blocks concurrent saves', async () => {
    const api = standardView()
    let finish
    api.context.call.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const pending = api.createOrUpdateStandardView()
    api.context.view.value.filters.status = 'Closed'
    await api.createOrUpdateStandardView()
    expect(api.context.call).toHaveBeenCalledOnce()
    expect(api.context.call.mock.lastCall[1].view.filters.status).toBe('Open')
    finish()
    await pending
    expect(api.context.clearUnsaved).not.toHaveBeenCalled()
    expect(api.context.viewUpdated.value).toBe(true)
  })

  it('retains unsaved changes and reports failed saves', async () => {
    const api = standardView()
    api.context.call.mockRejectedValue(new Error('Permission denied'))
    await api.createOrUpdateStandardView()
    expect(api.context.clearUnsaved).not.toHaveBeenCalled()
    expect(api.context.viewUpdated.value).toBe(true)
    expect(api.context.savingView.value).toBe(false)
    expect(api.context.toast.error).toHaveBeenCalledWith('Permission denied')
  })
})

describe('data fields document contracts', () => {
  function dataFields() {
    const document = {
      doc: { name: 'Q-1', doctype: 'Quotation', docstatus: 0, amount: 20 },
      originalDoc: {
        name: 'Q-1',
        doctype: 'Quotation',
        docstatus: 0,
        amount: 10,
      },
      isDirty: true,
      enriching: false,
      reload: vi.fn().mockResolvedValue(),
      save: {
        loading: false,
        submit: vi.fn(async (_, options) => options.onSuccess()),
      },
    }
    const resource = { submit: vi.fn().mockResolvedValue({}) }
    const context = {
      document,
      permissions: {
        data: {
          permissions: { write: true, submit: true, cancel: true, amend: true },
        },
      },
      attrs: {},
      isSaving: ref(false),
      fetchingItems: ref(false),
      emit: vi.fn(),
      props: { doctype: 'Quotation', docname: 'Q-1' },
      showConfirmDialogBox: ref(true),
      showAmendConfirm: ref(true),
      hasAmendedChild: { data: 0 },
      amendResource: { loading: false, submit: vi.fn() },
      createResource: vi.fn().mockReturnValue(resource),
      toast: { error: vi.fn() },
      __: (text) => text,
    }
    return {
      context,
      resource,
      ...handlers(
        'components/Activities/DataFields.vue',
        ['saveChanges', 'updateSubmission', 'amendDocument'],
        context,
      ),
    }
  }

  it('delegates to a beforeSave listener without a duplicate resource save', async () => {
    const api = dataFields()
    api.context.attrs.onBeforeSave = vi.fn()
    await api.saveChanges()
    expect(api.context.emit).toHaveBeenCalledWith('beforeSave', { amount: 20 })
    expect(api.context.document.save.submit).not.toHaveBeenCalled()
  })

  it('uses the script-patched save and emits only after reloading', async () => {
    const api = dataFields()
    await api.saveChanges()
    expect(api.context.document.save.submit).toHaveBeenCalledOnce()
    expect(api.context.document.reload).toHaveBeenCalledOnce()
    expect(api.context.emit).toHaveBeenCalledWith('afterSave', { amount: 20 })
    expect(api.context.isSaving.value).toBe(false)
    expect(api.context.document.isDirty).toBe(true)
  })

  it('keeps dirty state and releases local loading on validation failure', async () => {
    const api = dataFields()
    api.context.document.save.submit.mockRejectedValue(
      new Error('Required field'),
    )
    await expect(api.saveChanges()).rejects.toThrow('Required field')
    expect(api.context.document.isDirty).toBe(true)
    expect(api.context.isSaving.value).toBe(false)
    expect(api.context.document.reload).not.toHaveBeenCalled()
    expect(api.context.emit).not.toHaveBeenCalled()
  })

  it.each(['permission', 'items', 'enrichment', 'loading'])(
    'blocks saving during %s restrictions',
    async (reason) => {
      const api = dataFields()
      if (reason === 'permission')
        api.context.permissions.data.permissions.write = false
      if (reason === 'items') api.context.fetchingItems.value = true
      if (reason === 'enrichment') api.context.document.enriching = true
      if (reason === 'loading') api.context.document.save.loading = true
      await api.saveChanges()
      expect(api.context.document.save.submit).not.toHaveBeenCalled()
    },
  )

  it.each([false, true])(
    'uses dedicated submit/cancel endpoints (cancel=%s)',
    async (cancel) => {
      const api = dataFields()
      api.context.document.isDirty = false
      api.context.document.doc.docstatus = cancel ? 1 : 0
      await api.updateSubmission(cancel)
      expect(api.context.createResource).toHaveBeenCalledWith({
        url: cancel ? 'frappe.client.cancel' : 'frappe.client.submit',
      })
      expect(api.resource.submit).toHaveBeenCalledWith(
        cancel
          ? { doctype: 'Quotation', name: 'Q-1' }
          : { doc: api.context.document.doc },
      )
      expect(api.context.emit).toHaveBeenCalledWith('afterSave', {
        docstatus: cancel ? 2 : 1,
      })
      expect(api.context.document.doc.docstatus).toBe(cancel ? 1 : 0)
    },
  )

  it('refuses submission with pending edits or without permission', async () => {
    const api = dataFields()
    await api.updateSubmission(false)
    api.context.document.isDirty = false
    api.context.permissions.data.permissions.submit = false
    await api.updateSubmission(false)
    expect(api.context.createResource).not.toHaveBeenCalled()
  })

  it('amends a deep copy without reusing child identities or mutating the original', () => {
    const api = dataFields()
    api.context.document.doc.docstatus = 2
    api.context.document.doc.items = [
      {
        doctype: 'Quotation Item',
        name: 'ROW-1',
        parent: 'Q-1',
        owner: 'user',
        __item_fetched: true,
        item_code: 'ITEM-1',
        docstatus: 2,
      },
    ]
    api.amendDocument()
    const copy = api.context.amendResource.submit.mock.lastCall[0].doc
    expect(copy.name).toBeUndefined()
    expect(copy.amended_from).toBe('Q-1')
    expect(copy.docstatus).toBe(0)
    expect(copy.items).toEqual([
      { doctype: 'Quotation Item', item_code: 'ITEM-1', docstatus: 0 },
    ])
    expect(api.context.document.doc.items[0].name).toBe('ROW-1')
  })
})

describe('custom and ERPNext quotation coexistence', () => {
  it('keeps the custom tab and gates only the separately valued ERPNext tab', () => {
    const source = readFileSync(
      resolve(import.meta.dirname, '../../src/pages/Deal.vue'),
      'utf8',
    )
    const { descriptor } = parse(source)
    const { scriptSetupAst } = compileScript(descriptor, { id: 'deal-tabs' })
    const declaration = scriptSetupAst.find(
      (node) =>
        node.type === 'VariableDeclaration' &&
        node.declarations.some((entry) => entry.id.name === 'tabs'),
    )
    const code = descriptor.scriptSetup.content.slice(
      declaration.start,
      declaration.end,
    )
    const icons = Object.fromEntries(
      [...code.matchAll(/iconLeft:\s*(\w+)/g)].map((match) => [match[1], {}]),
    )
    const canViewQuotations = ref(false)
    const context = {
      ...icons,
      computed,
      canViewQuotations,
      whatsappEnabled: ref(false),
      __: (text) => text,
    }
    const tabs = new Function(...Object.keys(context), `${code}; return tabs`)(
      ...Object.values(context),
    )
    expect(tabs.value.find((tab) => tab.name === 'Quotations').value).toBe(
      'quotations',
    )
    expect(tabs.value.some((tab) => tab.name === 'ERPNext Quotations')).toBe(
      false,
    )
    canViewQuotations.value = true
    expect(
      tabs.value.find((tab) => tab.name === 'ERPNext Quotations').value,
    ).toBe('erpnext-quotations')
    expect(new Set(tabs.value.map((tab) => tab.value)).size).toBe(
      tabs.value.length,
    )
  })

  it('keeps distinct renderers and creation actions', () => {
    const source = readFileSync(
      resolve(
        import.meta.dirname,
        '../../src/components/Activities/Activities.vue',
      ),
      'utf8',
    )
    const header = readFileSync(
      resolve(
        import.meta.dirname,
        '../../src/components/Activities/ActivityHeader.vue',
      ),
      'utf8',
    )
    expect(source).toMatch(
      /<QuotationsList v-if="title == 'ERPNext Quotations'"/,
    )
    expect(source).toMatch(
      /v-else-if="title == 'Quotations'"[\s\S]*?<QuotationArea/,
    )
    expect(header).toMatch(
      /v-else-if="title == 'Quotations'"[\s\S]*?modalRef.showQuotation\(\)/,
    )
  })

  it('dispatches project task actions to Smart Task', async () => {
    const context = {
      call: vi.fn().mockResolvedValue({}),
      activities: ref({ reload: vi.fn() }),
    }
    const api = handlers(
      'components/Activities/AllModals.vue',
      ['deleteProjectTask', 'updateProjectTaskStatus'],
      context,
    )
    await api.deleteProjectTask('TASK-1')
    api.updateProjectTaskStatus('Completed', { name: 'TASK-1' })
    expect(context.call.mock.calls.map(([, params]) => params.doctype)).toEqual(
      ['Smart Task', 'Smart Task'],
    )
  })
})

describe('grid field permissions', () => {
  function grid(overrides = {}) {
    const context = {
      props: { parentFieldname: 'items', readOnly: false },
      parentFieldPropertyOverrides: ref(overrides),
      gridSettings: ref({ editable_grid: true }),
      isFetchedFromLink: vi.fn().mockReturnValue(false),
      triggerOnChange: vi.fn(),
    }
    return {
      context,
      ...handlers(
        'components/Controls/Grid.vue',
        ['getRowFieldObj', 'fieldChange'],
        context,
      ),
    }
  }

  it('keeps row overrides above column overrides without mutating metadata', () => {
    const api = grid({
      'items.qty': { read_only: 1 },
      'items.qty:R1': { read_only: 0 },
    })
    const field = { fieldname: 'qty', read_only: 0 }
    expect(api.getRowFieldObj(field, { name: 'R1' }).disabled).toBe(false)
    expect(api.getRowFieldObj(field, { name: 'R2' }).disabled).toBe(true)
    expect(field.read_only).toBe(0)
    api.context.props.readOnly = true
    expect(api.getRowFieldObj(field, { name: 'R1' }).disabled).toBe(true)
  })

  it('respects fetched fields and disabled inline editing', () => {
    const api = grid()
    api.context.gridSettings.value.editable_grid = false
    expect(api.getRowFieldObj({ fieldname: 'qty' }, {}).disabled).toBe(true)
    api.context.gridSettings.value.editable_grid = true
    api.context.isFetchedFromLink.mockReturnValue(true)
    expect(api.getRowFieldObj({ fieldname: 'qty' }, {}).disabled).toBe(true)
  })

  it('rejects read-only updates and preserves checkbox/link values', () => {
    const api = grid()
    const row = { name: 'R1' }
    api.fieldChange(true, { fieldname: 'enabled', disabled: true }, row)
    expect(api.context.triggerOnChange).not.toHaveBeenCalled()
    api.fieldChange(false, { fieldname: 'enabled' }, row)
    expect(api.context.triggerOnChange).toHaveBeenLastCalledWith(
      'enabled',
      false,
      row,
    )
    api.fieldChange({ value: 'ITEM-1' }, { fieldname: 'item_code' }, row)
    expect(api.context.triggerOnChange).toHaveBeenLastCalledWith(
      'item_code',
      'ITEM-1',
      row,
    )
  })
})
