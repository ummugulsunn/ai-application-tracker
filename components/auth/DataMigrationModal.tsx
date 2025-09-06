"use client"

import { useState } from "react"
import { AuthUser } from "@/types/auth"
import { performCompleteMigration, getMigrationPreview, MigrationResult } from "@/lib/dataMigration"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  FileText,
  Settings,
  X
} from "lucide-react"
import toast from "react-hot-toast"

interface DataMigrationModalProps {
  isOpen: boolean
  onClose: () => void
  user: AuthUser
  onMigrationComplete: (result: MigrationResult) => void
}

export function DataMigrationModal({ 
  isOpen, 
  onClose, 
  user, 
  onMigrationComplete 
}: DataMigrationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [step, setStep] = useState<'preview' | 'migrating' | 'complete'>('preview')
  
  const { clearGuestData } = useAuthStore()
  
  if (!isOpen) return null

  const migrationPreview = getMigrationPreview()

  const handleMigration = async () => {
    setIsLoading(true)
    setStep('migrating')
    
    try {
      const result = await performCompleteMigration(user)
      setMigrationResult(result)
      setStep('complete')
      
      if (result.success) {
        toast.success(`Successfully migrated ${result.migratedApplications} applications!`)
        onMigrationComplete(result)
      } else {
        toast.error('Migration completed with some errors. Please check the details.')
      }
    } catch (error) {
      console.error('Migration failed:', error)
      const errorResult: MigrationResult = {
        success: false,
        migratedApplications: 0,
        migratedOnboardingData: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      }
      setMigrationResult(errorResult)
      setStep('complete')
      toast.error('Migration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipMigration = () => {
    // Clear guest data and close modal
    clearGuestData()
    onClose()
    toast.success('Started fresh with your new account!')
  }

  const handleComplete = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'preview' && 'Migrate Your Data'}
              {step === 'migrating' && 'Migrating Data...'}
              {step === 'complete' && 'Migration Complete'}
            </h2>
            {step !== 'migrating' && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                We found data from your guest session. Would you like to migrate it to your new account?
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Data to migrate:</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>{migrationPreview.applicationCount} job applications</span>
                  </div>
                  
                  {migrationPreview.hasOnboardingData && (
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-blue-600" />
                      <span>Onboarding progress and preferences</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-600 mt-2">
                    Total size: {migrationPreview.estimatedDataSize}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Your data will be securely transferred to your account
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleMigration}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Migrate Data
                </Button>
                <Button
                  onClick={handleSkipMigration}
                  variant="outline"
                  className="flex-1"
                >
                  Start Fresh
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                You can also skip this step and start with a clean account
              </p>
            </div>
          )}

          {/* Migrating Step */}
          {step === 'migrating' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Migrating your data...
                </h3>
                <p className="text-gray-600 mt-1">
                  Please don't close this window. This may take a few moments.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Transferring {migrationPreview.applicationCount} applications to your account
                </p>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && migrationResult && (
            <div className="space-y-4">
              {migrationResult.success ? (
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Migration Successful!
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Your data has been successfully transferred to your account.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Migration Completed with Issues
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Some data was migrated, but there were some issues.
                  </p>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Migration Summary:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Applications migrated:</span>
                    <span className="font-medium">{migrationResult.migratedApplications}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Onboarding data:</span>
                    <span className="font-medium">
                      {migrationResult.migratedOnboardingData ? 'Migrated' : 'Skipped'}
                    </span>
                  </div>
                </div>
              </div>

              {migrationResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-medium text-red-900 mb-2">Issues encountered:</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    {migrationResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={handleComplete}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue to Dashboard
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}