'use client'

import { useState } from 'react'
import { usePWAInstall } from '@/lib/pwa/serviceWorker'
import { Button } from '@/components/ui/Button'
import { XMarkIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall()
  const [isDismissed, setIsDismissed] = useState(false)

  if (isInstalled || !isInstallable || isDismissed) {
    return null
  }

  const handleInstall = async () => {
    const success = await installApp()
    if (success) {
      setIsDismissed(true)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
      >
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <DevicePhoneMobileIcon className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                Install App
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Add AI Application Tracker to your home screen for quick access and offline use.
              </p>
              
              <div className="flex items-center space-x-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="text-xs"
                >
                  Install
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-xs"
                >
                  Not now
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export function PWAInstallButton({ className = '' }: { className?: string }) {
  const { isInstallable, isInstalled, installApp } = usePWAInstall()

  if (isInstalled || !isInstallable) {
    return null
  }

  return (
    <Button
      onClick={installApp}
      variant="outline"
      size="sm"
      className={className}
    >
      <DevicePhoneMobileIcon className="w-4 h-4 mr-2" />
      Install App
    </Button>
  )
}