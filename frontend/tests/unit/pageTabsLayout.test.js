import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// The detail-page Tabs class must style only the direct child tab panels.
// A descendant `[role='tabpanel']` selector also matches nested tab panels and
// turns the outer panel into a row, pushing the Activity header (and its New
// button) to the left instead of keeping it on top.
const pages = [
  'Project.vue',
  'ProjectTask.vue',
  'Quotation.vue',
  'Event.vue',
  'GammaProposal.vue',
  'EmployeeDateRequest.vue',
  'EmployeeProjectAssignment.vue',
  'SmartTimesheet.vue',
  'MobileProject.vue',
  'MobileProjectTask.vue',
  'MobileQuotation.vue',
  'MobileEvent.vue',
  'MobileGamma.vue',
  'MobileGammaProposal.vue',
  'MobileEmployeeDateRequest.vue',
  'MobileEmployeeProjectAssignment.vue',
  'MobileSmartTimesheet.vue',
]

describe('detail page tab panel layout', () => {
  it.each(pages)('%s stacks header above content', (page) => {
    const source = readFileSync(
      resolve(import.meta.dirname, '../../src/pages', page),
      'utf8',
    )
    const tabsClass = source.match(/<Tabs[\s\S]*?class="([^"]+)"/)
    expect(tabsClass).not.toBeNull()
    const classes = tabsClass[1]

    expect(classes).not.toContain("[&_[role='tabpanel']")
    expect(classes).toContain("[&>[role='tabpanel']:not([hidden])]:flex")
    expect(classes).toContain("[&>[data-slot=tab-panel]]:flex-col")
  })
})
