import { useEffect, useState } from 'react'
import { Download, Share } from 'lucide-react'
import { buttonStyles, Modal } from './ui'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: InstallPromptEvent | null = null
const listeners = new Set<(event: InstallPromptEvent | null) => void>()

function publish() {
  for (const listener of listeners) listener(deferredPrompt)
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as InstallPromptEvent
    publish()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    publish()
  })
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone
}

function isIosSafari() {
  const ua = navigator.userAgent
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document)
  const safari = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
  return ios && safari
}

export function InstallAppButton({ className }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(deferredPrompt)
  const [installed, setInstalled] = useState(isStandalone())
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('neurobloom:install-dismissed') === '1',
  )
  const [iosOpen, setIosOpen] = useState(false)

  useEffect(() => {
    const listener = (event: InstallPromptEvent | null) => setPromptEvent(event)
    listeners.add(listener)
    const sync = () => setInstalled(isStandalone())
    const media = window.matchMedia('(display-mode: standalone)')
    media.addEventListener('change', sync)
    window.addEventListener('appinstalled', sync)
    return () => {
      listeners.delete(listener)
      media.removeEventListener('change', sync)
      window.removeEventListener('appinstalled', sync)
    }
  }, [])

  if (installed || dismissed) return null

  const iosHint = isIosSafari()
  if (!promptEvent && !iosHint) return null

  const install = async () => {
    if (!promptEvent) {
      setIosOpen(true)
      return
    }
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    if (choice.outcome === 'accepted') {
      setInstalled(true)
      return
    }
    sessionStorage.setItem('neurobloom:install-dismissed', '1')
    setDismissed(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void install()}
        className={buttonStyles('outline', 'sm', className)}
        aria-label="Install the NeuroBloom app"
      >
        <Download size={14} />
        <span className="hidden sm:inline">Install app</span>
      </button>
      <Modal
        open={iosOpen}
        onClose={() => setIosOpen(false)}
        title="Add NeuroBloom to your home screen"
        subtitle="It opens full screen, like an app, and keeps you signed in."
        size="sm"
      >
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">1</span>
            <span className="inline-flex items-center gap-1.5">
              Tap the <Share size={14} className="text-foreground" /> Share button in Safari
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">2</span>
            <span>Scroll down and choose <span className="font-semibold text-foreground">Add to Home Screen</span></span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">3</span>
            <span>Tap <span className="font-semibold text-foreground">Add</span> — NeuroBloom appears with your other apps</span>
          </li>
        </ol>
      </Modal>
    </>
  )
}
