// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { build } from 'vite'
import config from '../../vite.config'

// Use the production chunk policy with real Leaflet modules and an eager marker
// asset, as imported by GeolocationControl before its map dialog is opened.
describe('production geolocation chunk initialization', () => {
  let chunks
  let initialChunks

  beforeAll(async () => {
    const result = await build({
      configFile: false,
      root: new URL('../..', import.meta.url).pathname,
      logLevel: 'silent',
      plugins: [
        {
          name: 'geolocation-chunk-regression',
          resolveId(id) {
            if (id === 'map-entry') return '\0map-entry'
          },
          load(id) {
            if (id !== '\0map-entry') return
            return `
              import marker from 'leaflet/dist/images/marker-icon.png?url';
              export { marker };
              export async function openMap() {
                const leaflet = await import('leaflet');
                await import('leaflet-draw');
                const locate = await import('leaflet.locatecontrol');
                return { leaflet, locate };
              }
            `
          },
        },
      ],
      build: {
        write: false,
        minify: false,
        rollupOptions: {
          input: 'map-entry',
          preserveEntrySignatures: 'strict',
          output: config().build.rollupOptions.output,
        },
      },
    })
    chunks = result.output.filter((output) => output.type === 'chunk')
    initialChunks = new Set()
    const visit = (chunk) => {
      if (initialChunks.has(chunk)) return
      initialChunks.add(chunk)
      for (const file of chunk.imports) {
        const dependency = chunks.find((item) => item.fileName === file)
        if (dependency) visit(dependency)
      }
    }
    visit(chunks.find((chunk) => chunk.isEntry))
  }, 30000)

  const contains = (chunk, module) =>
    Object.keys(chunk.modules).some((id) => id.includes(module))

  it('does not initialize the global Draw plugin while loading marker assets', () => {
    expect(
      [...initialChunks].some((chunk) =>
        contains(chunk, '/leaflet-draw/dist/leaflet.draw.js'),
      ),
    ).toBe(false)
  })

  it('keeps the Draw import separate from the Leaflet initialization chunk', () => {
    const leaflet = chunks.find((chunk) =>
      contains(chunk, '/leaflet/dist/leaflet-src.js'),
    )
    const draw = chunks.find((chunk) =>
      contains(chunk, '/leaflet-draw/dist/leaflet.draw.js'),
    )
    expect(leaflet).toBeDefined()
    expect(draw).toBeDefined()
    expect(draw).not.toBe(leaflet)
  })

  it('keeps map runtime code out of the initial static dependency graph', () => {
    expect(
      [...initialChunks].some((chunk) =>
        contains(chunk, '/leaflet/dist/leaflet-src.js'),
      ),
    ).toBe(false)
  })
})
