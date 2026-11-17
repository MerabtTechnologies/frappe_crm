import { Storage } from 'happy-dom'

// Minimal globals that CRM code expects
globalThis.__ = (msg, args) => {
  if (!args) return msg
  let str = msg
  if (Array.isArray(args)) {
    args.forEach((arg, i) => {
      str = str.replace(`{${i}}`, arg)
    })
  }
  return str
}

globalThis.window = globalThis.window || {}
globalThis.window.sysdefaults = { currency: 'USD' }

// Node 25 exposes a separate, incomplete Web Storage global in test workers.
for (const name of ['localStorage', 'sessionStorage']) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: new Storage(),
  })
}
