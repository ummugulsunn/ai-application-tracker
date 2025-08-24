'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Dashboard from '@/components/Dashboard'
import ApplicationTable from '@/components/ApplicationTable'
import AddApplicationModal from '@/components/AddApplicationModal'
import ImportModal from '@/components/ImportModal'
import { Application, useApplicationStore } from '@/store/applicationStore'
import { toast } from 'react-hot-toast'

export default function Home() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const { applications, addApplication, importApplications } = useApplicationStore()

  // Sample data for demonstration
  useEffect(() => {
    if (applications.length === 0) {
      const sampleData: Application[] = [
        {
          id: '1',
          company: 'Spotify',
          position: 'Software Engineer Intern',
          location: 'Stockholm, Sweden',
          type: 'Internship',
          salary: '15,000 SEK/month',
          status: 'Applied',
          appliedDate: '2024-01-15',
          responseDate: null,
          interviewDate: null,
          notes: 'Applied through LinkedIn. Position focuses on backend development.',
          contactPerson: 'Sarah Johnson',
          contactEmail: 'careers@spotify.com',
          website: 'https://spotify.com/careers',
          tags: ['Backend', 'Music', 'Sweden'],
          priority: 'High'
        },
        {
          id: '2',
          company: 'Klarna',
          position: 'Data Science Intern',
          location: 'Stockholm, Sweden',
          type: 'Internship',
          salary: '14,000 SEK/month',
          status: 'Interviewing',
          appliedDate: '2024-01-10',
          responseDate: '2024-01-20',
          interviewDate: '2024-02-05',
          notes: 'First round interview scheduled. Technical assessment completed.',
          contactPerson: 'Marcus Andersson',
          contactEmail: 'internships@klarna.com',
          website: 'https://klarna.com/careers',
          tags: ['Data Science', 'Fintech', 'Sweden'],
          priority: 'High'
        },
        {
          id: '3',
          company: 'Ericsson',
          position: 'Network Engineering Intern',
          location: 'Gothenburg, Sweden',
          type: 'Internship',
          salary: '12,000 SEK/month',
          status: 'Pending',
          appliedDate: '2024-01-20',
          responseDate: null,
          interviewDate: null,
          notes: 'Application submitted. Waiting for response.',
          contactPerson: 'Elena Petrova',
          contactEmail: 'career@ericsson.com',
          website: 'https://ericsson.com/careers',
          tags: ['Networking', 'Telecom', 'Sweden'],
          priority: 'Medium'
        }
      ]
      
      sampleData.forEach(app => addApplication(app))
      toast.success('Sample data loaded! Start tracking your applications.')
    }
  }, [applications.length, addApplication])

  const handleImportSuccess = (importedApps: Application[]) => {
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
        <Dashboard />
        <ApplicationTable />
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
