'use client'

import { useState, useEffect } from 'react'

// Service Worker registration and management
export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  onError?: (error: Error) => void
}

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
)

export function registerServiceWorker(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href)
    if (publicUrl.origin !== window.location.origin) {
      return
    }

    window.addEventListener('load', () => {
      const swUrl = '/sw.js'

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config)
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service worker.'
          )
        })
      } else {
        registerValidServiceWorker(swUrl, config)
      }
    })
  }
}

function registerValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing
        if (installingWorker == null) {
          return
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log(
                'New content is available and will be used when all tabs for this page are closed.'
              )
              if (config && config.onUpdate) {
                config.onUpdate(registration)
              }
            } else {
              console.log('Content is cached for offline use.')
              if (config && config.onSuccess) {
                config.onSuccess(registration)
              }
            }
          }
        }
      }
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error)
      if (config && config.onError) {
        config.onError(error)
      }
    })
}

function checkValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' }
  })
    .then((response) => {
      const contentType = response.headers.get('content-type')
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload()
          })
        })
      } else {
        registerValidServiceWorker(swUrl, config)
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.')
    })
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        console.error(error.message)
      })
  }
}

// PWA installation prompt
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    checkInstalled()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setIsInstallable(false)
      return true
    }
    
    return false
  }

  return {
    isInstallable,
    isInstalled,
    installApp
  }
}

// Network status detection
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState<string>('unknown')

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Detect connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection.effectiveType || 'unknown')
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown')
      }
      
      connection.addEventListener('change', handleConnectionChange)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        connection.removeEventListener('change', handleConnectionChange)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, connectionType }
}

// Background sync for offline actions
export class OfflineActionQueue {
  private queue: Array<{
    id: string
    action: string
    data: any
    timestamp: number
  }> = []

  constructor() {
    this.loadQueue()
  }

  addAction(action: string, data: any) {
    const item = {
      id: crypto.randomUUID(),
      action,
      data,
      timestamp: Date.now()
    }
    
    this.queue.push(item)
    this.saveQueue()
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncQueue()
    }
  }

  async syncQueue() {
    if (!navigator.onLine || this.queue.length === 0) return

    const itemsToSync = [...this.queue]
    
    for (const item of itemsToSync) {
      try {
        await this.processAction(item)
        this.removeFromQueue(item.id)
      } catch (error) {
        console.error('Failed to sync action:', error)
        // Keep item in queue for retry
      }
    }
  }

  private async processAction(item: any) {
    // Process different types of offline actions
    switch (item.action) {
      case 'ADD_APPLICATION':
        // Send to API
        await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        })
        break
      case 'UPDATE_APPLICATION':
        await fetch(`/api/applications/${item.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        })
        break
      case 'DELETE_APPLICATION':
        await fetch(`/api/applications/${item.data.id}`, {
          method: 'DELETE'
        })
        break
      default:
        console.warn('Unknown action type:', item.action)
    }
  }

  private removeFromQueue(id: string) {
    this.queue = this.queue.filter(item => item.id !== id)
    this.saveQueue()
  }

  private saveQueue() {
    localStorage.setItem('offline-queue', JSON.stringify(this.queue))
  }

  private loadQueue() {
    try {
      const saved = localStorage.getItem('offline-queue')
      if (saved) {
        this.queue = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error)
      this.queue = []
    }
  }

  getQueueLength() {
    return this.queue.length
  }

  clearQueue() {
    this.queue = []
    this.saveQueue()
  }
}

// Hook for offline functionality
export function useOfflineSync() {
  const [queue] = useState(() => new OfflineActionQueue())
  const [queueLength, setQueueLength] = useState(0)
  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    const updateQueueLength = () => {
      setQueueLength(queue.getQueueLength())
    }

    // Update queue length periodically
    const interval = setInterval(updateQueueLength, 1000)
    updateQueueLength()

    return () => clearInterval(interval)
  }, [queue])

  useEffect(() => {
    if (isOnline) {
      queue.syncQueue()
    }
  }, [isOnline, queue])

  const addOfflineAction = (action: string, data: any) => {
    queue.addAction(action, data)
    setQueueLength(queue.getQueueLength())
  }

  return {
    addOfflineAction,
    queueLength,
    isOnline,
    syncQueue: () => queue.syncQueue(),
    clearQueue: () => {
      queue.clearQueue()
      setQueueLength(0)
    }
  }
}