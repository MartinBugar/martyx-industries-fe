export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const iPadOS = navigator.platform === 'MacIntel' && 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 1
  return iOS || iPadOS
}
