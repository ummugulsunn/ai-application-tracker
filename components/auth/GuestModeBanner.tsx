"use client"

import { useState } from "react"
import { useAuthStore } from "@/store/authStore"
import { getMigrationPreview } from "@/lib/dataMigration"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { X, User, Database, Shield, ArrowRight } from "lucide-react"

interface GuestModeBannerProps {
  onRegisterClick: () => void
  onLoginClick: () => void
}

export function GuestModeBanner({ onRegisterClick, onLoginClick }: GuestModeBannerProps) {
  const { isGuest, hasGuestData, shouldPromptRegistration } = useAuthStore()
  const [isDismissed, setIsDismissed] = useState(false)
  
  // Don't show banner if user is authenticated or has dismissed it
  if (!isGuest || isDismissed) {
    return null
  }

  const migrationPreview = getMigrationPreview()
  const showDataPreview = hasGuestData && migrationPreview.applicationCount > 0

  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                You're using Guest Mode
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Your data is stored locally on this device. Create an account to sync across devices and never lose your data.
              </p>
              
              {showDataPreview && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Your current data:</span>
                  </div>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>• {migrationPreview.applicationCount} job applications</li>
                    {migrationPreview.hasOnboardingData && (
                      <li>• Onboarding progress and preferences</li>
                    )}
                    <li>• Data size: {migrationPreview.estimatedDataSize}</li>
                  </ul>
                  <p className="mt-2 text-xs text-blue-600 font-medium">
                    ✓ All data will be preserved when you create an account
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={onRegisterClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Create Account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  onClick={onLoginClick}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Sign In
                </Button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                <p>Benefits of creating an account:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Sync data across all your devices</li>
                  <li>• Automatic cloud backup</li>
                  <li>• Enhanced AI insights and recommendations</li>
                  <li>• Access to premium features</li>
                </ul>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Card>
  )
}

// Compact version for smaller spaces
export function GuestModeIndicator({ onRegisterClick }: { onRegisterClick: () => void }) {
  const { isGuest } = useAuthStore()
  
  if (!isGuest) {
    return null
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
      <User className="h-4 w-4 text-blue-600" />
      <span className="text-sm text-blue-700">Guest Mode</span>
      <Button
        onClick={onRegisterClick}
        size="sm"
        className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
      >
        Save Data
      </Button>
    </div>
  )
}