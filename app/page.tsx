'use client'

import { useState, useEffect } from 'react'
import Header from '../components/Header'
import Dashboard from '../components/Dashboard'
import ApplicationTable from '../components/ApplicationTable'
import AddApplicationModal from '../components/AddApplicationModal'
import ImportModal from '../components/ImportModal'
import ErrorBoundary from '../components/ErrorBoundary'
import { useApplicationStore } from '../store/applicationStore'
import { toast } from 'react-hot-toast'

export default function Home() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const { initializeSampleData, importApplications, cleanupInvalidData } = useApplicationStore()

  // Initialize sample data once when component mounts
  useEffect(() => {
    initializeSampleData()
    // Clean up any invalid data that might exist
    cleanupInvalidData()
  }, [initializeSampleData, cleanupInvalidData])

  const handleImportSuccess = (importedApps: any[]) => {
    importApplications(importedApps)
    setIsImportModalOpen(false)
    toast.success(`Successfully imported ${importedApps.length} applications!`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header 
        onAddNew={() => setIsAddModalOpen(true)}
        onImport={() => setIsImportModalOpen(true)}
      />
      
      <main className="container mx-auto px-4 py-8">
        <ErrorBoundary>
          <Dashboard />
        </ErrorBoundary>
        <ErrorBoundary>
          <ApplicationTable />
        </ErrorBoundary>
      </main>

      <AddApplicationModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  )
}
