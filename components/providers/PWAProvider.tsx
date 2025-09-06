'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/pwa/serviceWorker'
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'
import { OfflineIndicator, OfflineBanner } from '@/components/pwa/OfflineIndicator'
import { toast } from 'react-hot-toast'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker({
        onUpdate: (registration) => {
          toast.success('New version available! Refresh to update.', {
            duration: 6000,
            icon: '🔄',
          })
        },
        onSuccess: (registration) => {
          console.log('Service Worker registered successfully')
        },
        onError: (error) => {
          console.error('Service Worker registration failed:', error)
        }
      })
    }

    // Handle URL parameters for PWA shortcuts
    const urlParams = new URLSearchParams(window.location.search)
    const action = urlParams.get('action')
    
    if (action) {
      // Dispatch custom events for PWA shortcuts
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('pwa-shortcut', { 
          detail: { action } 
        }))
      }, 1000)
    }
  }, [])

  return (
    <>
      <OfflineBanner />
      <OfflineIndicator />
      {children}
      <PWAInstallPrompt />
    </>
  )
}