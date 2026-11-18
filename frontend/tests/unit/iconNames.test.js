import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// frappe-ui 1.0 only renders `lucide-*` icon-name strings on Button and menu
// items. A bare name (e.g. `trash-2`) silently renders nothing and can make an
// icon-only button disappear. Command palette commands are excluded: they use
// the app's sprite-backed Icon component, which accepts bare names.
const root = resolve(import.meta.dirname, '../../src')
const scanRoots = ['pages', 'components']

const forbidden = [
  /icon="(trash-2|x|plus|more-horizontal|chevron-right|download|import)"/,
  /iconLeft="(plus|tag|refresh-ccw)"/,
]

function vueFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      return entry === 'CommandPalette' ? [] : vueFiles(path)
    }
    return entry.endsWith('.vue') ? [path] : []
  })
}

const files = scanRoots.flatMap((dir) => vueFiles(join(root, dir)))

describe('frappe-ui icon names', () => {
  it.each(files.map((file) => [file.slice(root.length + 1), file]))(
    '%s uses lucide-* icon names',
    (_name, file) => {
      const source = readFileSync(file, 'utf8')
      for (const pattern of forbidden) {
        expect(source).not.toMatch(pattern)
      }
    },
  )
})
