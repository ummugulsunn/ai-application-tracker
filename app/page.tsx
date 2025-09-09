'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Dashboard from '@/components/Dashboard'
import ApplicationTable from '@/components/ApplicationTable'
import { 
  LazyImportModal,
  LazyExportModal,
  LazyBulkDuplicateManager,
  LazyBackupManager,
  LazyWelcomeWizard,
  LazyFeatureTour
} from '@/components/lazy/LazyComponents'
import AddApplicationModal from '@/components/AddApplicationModal'
import { QuickStart, ProgressiveDisclosure, OnboardingProgress } from '@/components/onboarding'
import { Application } from '@/types/application'
import { useApplicationStore } from '@/store/applicationStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { initializeAuthState } from '@/store/authStore'
import { toast } from 'react-hot-toast'

export default function Home() {
  const router = useRouter()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isBulkDuplicateManagerOpen, setIsBulkDuplicateManagerOpen] = useState(false)
  const [isBackupManagerOpen, setIsBackupManagerOpen] = useState(false)
  const { applications, addApplication, importApplications, getStats } = useApplicationStore()
  const { 
    isFirstVisit, 
    showWelcomeWizard, 
    showFeatureTour,
    showWizard,
    hideWizard,
    showTour,
    hideTour,
    completeStep,
    skipOnboarding
  } = useOnboardingStore()

  // Initialize authentication state
  useEffect(() => {
    initializeAuthState()
  }, [])

  // Show welcome wizard for first-time users
  useEffect(() => {
    if (isFirstVisit && applications.length === 0) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        showWizard()
      }, 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isFirstVisit, applications.length, showWizard])

  const handleImportSuccess = (importedApps: Application[]) => {
    importApplications(importedApps)
    setIsImportModalOpen(false)
    completeStep('add-application')
    toast.success(`Successfully imported ${importedApps.length} applications!`)
  }

  const handleAddApplication = () => {
    setIsAddModalOpen(true)
    completeStep('add-application')
  }

  const handleAddNew = () => {
    setIsAddModalOpen(true)
  }

  const handleImport = () => {
    setIsImportModalOpen(true)
  }

  const handleExport = () => {
    setIsExportModalOpen(true)
  }

  const handleShowHelp = () => {
    try {
      completeStep('explore-features')
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        showTour()
      }, 500)
    } catch (error) {
      console.error('Error starting tour:', error)
    }
  }

  const handleStartTour = () => {
    try {
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        showTour()
      }, 500)
    } catch (error) {
      console.error('Error showing help:', error)
    }
  }

  const handleViewAnalytics = () => {
    router.push('/analytics')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header 
        data-tour="header"
        onAddNew={handleAddNew}
        onImport={handleImport}
        onExport={handleExport}
        onShowHelp={handleShowHelp}
      />
      
      <main className="w-full max-w-screen-2xl mx-auto px-4 py-8">
        <div className="w-full max-w-6xl mx-auto">
          {/* Onboarding Progress - shown for users getting started */}
          {applications.length > 0 && applications.length < 20 && (
            <OnboardingProgress
              onStartAction={(actionId) => {
                switch (actionId) {
                  case 'first-application':
                    handleAddApplication()
                    break
                  case 'five-applications':
                    handleAddApplication()
                    break
                  default:
                    break
                }
              }}
            />
          )}

          {/* Quick Start Guide - shown for users with some progress */}
          {applications.length > 0 && applications.length < 8 && (
            <QuickStart
              onAddApplication={handleAddApplication}
              onImportCSV={() => setIsImportModalOpen(true)}
              onStartTour={handleStartTour}
            />
          )}

          <Dashboard 
            onAddNew={handleAddApplication}
            onImport={() => setIsImportModalOpen(true)}
            onExport={() => setIsExportModalOpen(true)}
            onViewAnalytics={handleViewAnalytics}
            onManageDuplicates={() => setIsBulkDuplicateManagerOpen(true)}
            onManageBackups={() => setIsBackupManagerOpen(true)}
          />
          
          <ApplicationTable data-tour="application-table" onAddNew={handleAddNew} />

          {/* Progressive Disclosure - shown when user has applications */}
          {applications.length > 0 && (
            <ProgressiveDisclosure className="mt-8" />
          )}
        </div>
      </main>

      {/* Modals */}
      <AddApplicationModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Lazy-loaded Modals */}
      {isImportModalOpen && (
        <LazyImportModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      )}

      {isExportModalOpen && (
        <LazyExportModal 
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          applications={applications}
          stats={getStats()}
        />
      )}

      {isBulkDuplicateManagerOpen && (
        <LazyBulkDuplicateManager
          isOpen={isBulkDuplicateManagerOpen}
          onClose={() => setIsBulkDuplicateManagerOpen(false)}
        />
      )}

      {isBackupManagerOpen && (
        <LazyBackupManager
          isOpen={isBackupManagerOpen}
          onClose={() => setIsBackupManagerOpen(false)}
        />
      )}

      {/* Lazy-loaded Onboarding Components */}
      {showWelcomeWizard && (
        <LazyWelcomeWizard
          isOpen={showWelcomeWizard}
          onClose={hideWizard}
          onStartTour={handleStartTour}
          onAddApplication={handleAddApplication}
          onImportCSV={() => setIsImportModalOpen(true)}
        />
      )}

      {showFeatureTour && (
        <LazyFeatureTour
          isOpen={showFeatureTour}
          onClose={hideTour}
          onComplete={() => {
            try {
              completeStep('explore-features')
            } catch (error) {
              console.error('Error completing tour step:', error)
            }
          }}
        />
      )}
    </div>
  )
}
