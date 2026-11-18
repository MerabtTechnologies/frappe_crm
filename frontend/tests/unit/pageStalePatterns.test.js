import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const pagesDir = resolve(import.meta.dirname, '../../src/pages')
const pageFiles = readdirSync(pagesDir).filter((file) => file.endsWith('.vue'))

function read(path) {
  return readFileSync(resolve(pagesDir, path), 'utf8')
}

// Custom pages were copied before several core refactors; these checks keep
// them from regressing back to the superseded modal and email-box APIs.
describe('custom page stale patterns', () => {
  it.each(pageFiles)('%s does not import legacy modal wrappers', (page) => {
    const source = read(page)
    expect(source).not.toContain(
      "import NoteModal from '@/components/Modals/NoteModal.vue'",
    )
    expect(source).not.toContain(
      "import TaskModal from '@/components/Modals/TaskModal.vue'",
    )
  })

  it.each(pageFiles)(
    '%s opens the email box through its exposed method',
    (page) => {
      expect(read(page)).not.toContain('emailBox.show = true')
    },
  )

  it('passes no removed reloadQuotations model to the quotation modal', () => {
    const source = readFileSync(
      resolve(
        import.meta.dirname,
        '../../src/components/Activities/AllModals.vue',
      ),
      'utf8',
    )
    expect(source).not.toContain('reloadQuotations')
  })

  it('keeps one quotation creation modal wired to defaults on the list page', () => {
    const source = read('Quotations.vue')
    expect(source).not.toContain('<GammaModal')
    expect(source.match(/<QuotationModal/g)).toHaveLength(1)
    expect(source).toContain(':defaults="defaults"')
    expect(source).not.toContain(':props="defaults"')
  })

  it('labels the events empty state for events', () => {
    const source = read('Events.vue')
    expect(source).toContain("__('No {0} Found', [__('Events')])")
    expect(source).not.toContain("__('No {0} Found', [__('Deals')])")
  })

  it('prints quotations through the PDF endpoint', () => {
    const source = read('Quotation.vue')
    expect(source).toContain('frappe.utils.print_format.download_pdf')
    expect(source).toContain('new URLSearchParams')
    expect(source).not.toContain('/printview?doctype=Quotation')
  })

  it('routes kanban cards and breadcrumbs to detail routes', () => {
    expect(read('Quotations.vue')).toMatch(
      /name: 'Quotation',\s*params: \{ quotationId: row\.name \}/,
    )
    expect(read('GammaProposals.vue')).toMatch(
      /name: 'Gamma',\s*params: \{ GammaId: row\.name \}/,
    )
    for (const page of ['MobileGamma.vue', 'MobileGammaProposal.vue']) {
      expect(read(page)).toContain(
        "route: { name: 'Gamma', params: { GammaId: props.GammaId } }",
      )
    }
    expect(read('MobileQuotation.vue')).toContain(
      "route: { name: 'Quotation', params: { quotationId: props.quotationId } }",
    )
    expect(read('Quotation.vue')).toMatch(
      /name: 'Quotations',\s*params: \{ viewType: route\.query\.viewType \}/,
    )
    expect(read('Event.vue')).toMatch(
      /name: 'Events',\s*params: \{ viewType: route\.query\.viewType \}/,
    )
  })
})
