// A route that points at a missing/deleted document must surface the error page
// without leaking unhandled promise rejections from the resources useDocument
// loads alongside it (document, assignees, permissions).
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('@/data/script', () => ({
  getScript: () => ({ setupScript: vi.fn(), scripts: {} }),
}))
vi.mock('@/stores/global', () => ({ globalStore: () => ({}) }))
vi.mock('@/stores/meta', () => ({ getMeta: () => ({}) }))
vi.mock('@/composables/useAttachments', () => ({
  useAttachments: () => ({
    trackOldFile: vi.fn(),
    processPendingDeletions: vi.fn(),
  }),
}))
vi.mock('@/composables/settings', () => ({
  showSettings: { value: false },
  activeSettingsPage: { value: '' },
}))
vi.mock('@/utils', () => ({
  runSequentially: vi.fn(),
  parseAssignees: (d) => d,
  sanitizeText: (t) => t,
}))
vi.mock('@/utils/fieldTransforms', () => ({ findMissingMandatory: () => [] }))
vi.mock('@/utils/fetchFrom', () => ({
  getFetchSource: vi.fn(),
  getFieldsToFetch: vi.fn(),
  getPendingFetchFields: vi.fn(),
  getSourceFieldnames: vi.fn(),
}))

const { resources, toast, missingDocError } = vi.hoisted(() => ({
  resources: [],
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
  missingDocError: () =>
    Object.assign(new Error('Smart Project MISSING-DOC not found'), {
      exc_type: 'DoesNotExistError',
      messages: ['Smart Project MISSING-DOC not found'],
    }),
}))

vi.mock('frappe-ui', () => ({
  call: vi.fn(),
  toast,
  createResource: (options) => {
    const resource = {
      options,
      data: options.initialData || null,
      fetch: vi.fn(() => Promise.reject(missingDocError())),
    }
    resource.reload = resource.fetch
    resource.submit = resource.fetch
    // useDocument wraps fetch, so keep the original spy for the assertion.
    resource.originalFetch = resource.fetch
    resources.push(resource)
    return resource
  },
  createDocumentResource: (options) => {
    const resource = {
      options,
      doc: {},
      reload: vi.fn(() => Promise.reject(missingDocError())),
      save: { submit: vi.fn() },
    }
    // useDocument wraps reload, so keep the original spy for the assertion.
    resource.originalReload = resource.reload
    resources.push(resource)
    return resource
  },
}))

import { useDocument } from '@/data/document'

describe('useDocument missing document', () => {
  beforeAll(() => {
    useDocument('Smart Project', 'MISSING-DOC')
  })

  it('does not auto-fetch resources before their rejections can be observed', () => {
    for (const resource of resources) {
      expect(resource.options.auto).toBe(false)
    }
  })

  it('loads the document, assignees and permissions at least once', () => {
    const document = resources.find(
      (resource) => resource.options.doctype === 'Smart Project',
    )
    expect(document.originalReload).toHaveBeenCalledTimes(1)

    const assignees = resources.find(
      (resource) => resource.options.url === 'crm.api.doc.get_assigned_users',
    )
    const permissions = resources.find(
      (resource) =>
        resource.options.url === 'frappe.client.get_doc_permissions',
    )
    expect(assignees.originalFetch).toHaveBeenCalledTimes(1)
    expect(permissions.originalFetch).toHaveBeenCalledTimes(1)
  })
})
