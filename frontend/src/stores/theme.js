import { useColorScheme } from 'frappe-ui'

const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme()
export const theme = colorScheme

export function toggleTheme() {
  toggleColorScheme()
}

export function setTheme(value) {
  const scheme = value || localStorage.getItem('theme') || 'light'
  setColorScheme(
    ['light', 'dark', 'system'].includes(scheme) ? scheme : 'light',
  )
}
