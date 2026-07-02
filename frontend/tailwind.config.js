import frappeUIPreset from 'frappe-ui/tailwind'

export default {
  presets: [frappeUIPreset],
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/frappe-ui/src/**/*.{vue,js,ts,jsx,tsx}',
    '../node_modules/frappe-ui/src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/frappe-ui/frappe/**/*.{vue,js,ts,jsx,tsx}',
    '../node_modules/frappe-ui/frappe/**/*.{vue,js,ts,jsx,tsx}',
  ],
  safelist: [
    '!text-ink-gray-2',
    '!text-ink-gray-4',
    '!text-ink-gray-5',
    '!text-ink-gray-7',
    '!text-ink-gray-9',
    '!text-sm',
    '!bg-surface-gray-1',
    '!bg-surface-gray-2',
    '!bg-surface-gray-3',
    '!bg-surface-gray-4',
    '!bg-surface-gray-5',
    '!bg-surface-modal',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
