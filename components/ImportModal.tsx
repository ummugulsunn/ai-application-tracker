'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import Papa from 'papaparse'
import { Application } from '@/types/application'
import { toast } from 'react-hot-toast'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess: (applications: Application[]) => void
}

export default function ImportModal({ isOpen, onClose, onImportSuccess }: ImportModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [importedData, setImportedData] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    setIsProcessing(true)
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsProcessing(false)
        if (results.errors.length > 0) {
          toast.error('Error parsing CSV file')
          console.error('CSV parsing errors:', results.errors)
          return
        }
        
        setImportedData(results.data)
        toast.success(`Successfully parsed ${results.data.length} rows`)
      },
      error: (error) => {
        setIsProcessing(false)
        toast.error('Error reading CSV file')
        console.error('CSV reading error:', error)
      }
    })
  }

  const handleImport = () => {
    if (importedData.length === 0) {
      toast.error('No data to import')
      return
    }

    try {
      const applications: Application[] = importedData.map((row, index) => {
        // Map CSV columns to Application fields
        const app: Application = {
          id: `imported-${Date.now()}-${index}`,
          company: row.Company || row.company || row.CompanyName || '',
          position: row.Position || row.position || row.JobTitle || '',
          location: row.Location || row.location || row.City || '',
          type: (row.Type || row.type || 'Full-time') as Application['type'],
          salary: row.Salary || row.salary || row.Compensation || '',
          status: (row.Status || row.status || 'Pending') as Application['status'],
          appliedDate: row['Applied Date'] || row.appliedDate || row.Date || new Date().toISOString().split('T')[0],
          responseDate: row['Response Date'] || row.responseDate || null,
          interviewDate: row['Interview Date'] || row.interviewDate || null,
          notes: row.Notes || row.notes || row.Description || '',
          contactPerson: row['Contact Person'] || row.contactPerson || row.Contact || '',
          contactEmail: row['Contact Email'] || row.contactEmail || row.Email || '',
          website: row.Website || row.website || row.URL || '',
          tags: row.Tags ? row.Tags.split(';').map((tag: string) => tag.trim()) : [],
          priority: (row.Priority || row.priority || 'Medium') as Application['priority'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        // Validate required fields
        if (!app.company || !app.position) {
          throw new Error(`Row ${index + 1}: Missing required fields (Company, Position)`)
        }

        return app
      })

      onImportSuccess(applications)
      setImportedData([])
      toast.success(`Successfully imported ${applications.length} applications!`)
    } catch (error) {
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const downloadTemplate = () => {
    const template = [
      'Company,Position,Location,Type,Salary,Status,Applied Date,Response Date,Interview Date,Notes,Contact Person,Contact Email,Website,Tags,Priority',
      'Spotify,Software Engineer Intern,Stockholm Sweden,Internship,15000 SEK/month,Applied,2024-01-15,,,Applied through LinkedIn,Sarah Johnson,careers@spotify.com,https://spotify.com/careers,"Backend; Music; Sweden",High',
      'Klarna,Data Scientist,Stockholm Sweden,Full-time,45000 SEK/month,Pending,2024-01-20,,,Waiting for response,Marcus Andersson,careers@klarna.com,https://klarna.com/careers,"Data Science; Fintech; Sweden",Medium'
    ].join('\n')

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'application_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Import Applications</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Instructions */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">How to import:</h3>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Prepare your CSV file with the required columns</li>
                    <li>Drag & drop or click to select your file</li>
                    <li>Review the parsed data</li>
                    <li>Click Import to add to your tracker</li>
                  </ol>
                </div>

                {/* Template Download */}
                <div className="mb-6">
                  <button
                    onClick={downloadTemplate}
                    className="btn-secondary flex items-center space-x-2 text-sm"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    <span>Download CSV Template</span>
                  </button>
                </div>

                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <ArrowDownTrayIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">
                      {isDragging ? 'Drop your CSV file here' : 'Drag and drop your CSV file here'}
                    </p>
                    <p className="mt-1">or</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-primary mt-2"
                    >
                      Browse Files
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Processing State */}
                {isProcessing && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center space-x-2 text-primary-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      <span>Processing CSV file...</span>
                    </div>
                  </div>
                )}

                {/* Preview Data */}
                {importedData.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Preview ({importedData.length} rows)
                    </h3>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(importedData[0] || {}).map((header) => (
                              <th
                                key={header}
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importedData.slice(0, 5).map((row, index) => (
                            <tr key={index}>
                              {Object.values(row).map((value, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate"
                                  title={String(value)}
                                >
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importedData.length > 5 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Showing first 5 rows of {importedData.length} total
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importedData.length === 0 || isProcessing}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import {importedData.length > 0 ? `(${importedData.length})` : ''}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
