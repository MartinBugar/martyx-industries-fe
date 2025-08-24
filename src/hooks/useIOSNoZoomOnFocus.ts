import { useEffect } from 'react'
import { isIOS } from '../lib/isIOS'

export function useIOSNoZoomOnFocus() {
  useEffect(() => {
    if (!isIOS()) return

    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
    if (!viewport) return

    const base = 'width=device-width, initial-scale=1, viewport-fit=cover'
    viewport.setAttribute('content', base) // ensure baseline

    const onFocusIn = (e: Event) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      const tag = t.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        // Temporarily prevent zoom while typing
        viewport.setAttribute('content', `${base}, maximum-scale=1`)
      }
    }

    const onFocusOut = () => {
      // Restore zoom capability after leaving the field
      viewport.setAttribute('content', base)
    }

    document.addEventListener('focusin', onFocusIn, true)
    document.addEventListener('focusout', onFocusOut, true)
    return () => {
      document.removeEventListener('focusin', onFocusIn, true)
      document.removeEventListener('focusout', onFocusOut, true)
    }
  }, [])
}
