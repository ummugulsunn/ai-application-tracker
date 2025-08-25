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
  const [validationErrors, setValidationErrors] = useState<string[]>([])
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
    setValidationErrors([])
    
    Papa.parse(file, {
      header: false, // Parse without headers first to check the structure
      skipEmptyLines: true,
      complete: (results) => {
        setIsProcessing(false)
        if (results.errors.length > 0) {
          toast.error('Error parsing CSV file')
          console.error('CSV parsing errors:', results.errors)
          return
        }
        
        if (results.data.length === 0) {
          toast.error('No data found in CSV file')
          return
        }
        
        // Check if first row looks like headers
        const firstRow = results.data[0] as string[]
        const isHeaderRow = firstRow.some(cell => {
          const cellStr = String(cell || '').toLowerCase()
          return ['company', 'position', 'location', 'type', 'salary', 'status', 'date', 'notes', 'contact', 'email', 'website', 'tags', 'priority'].some(keyword => 
            cellStr.includes(keyword)
          )
        })
        
        let dataRows = results.data
        let headers: string[] = []
        
        if (isHeaderRow) {
          // Use first row as headers, rest as data
          headers = firstRow.map(h => String(h || '').trim())
          dataRows = results.data.slice(1)
          console.log('Detected header row:', headers)
        } else {
          // Generate default headers
          headers = ['Company', 'Position', 'Location', 'Type', 'Salary', 'Status', 'Applied Date', 'Response Date', 'Interview Date', 'Notes', 'Contact Person', 'Contact Email', 'Website', 'Tags', 'Priority']
          console.log('Using default headers:', headers)
        }
        
        // Convert array data to objects with headers
        const validData = (dataRows as string[][])
          .filter((row: string[]) => {
            // Check if row has any meaningful data
            return row.some(cell => cell && String(cell).trim().length > 0)
          })
          .map((row: string[]) => {
            const obj: Record<string, string> = {}
            headers.forEach((header, index) => {
              obj[header] = String(row[index] || '').trim()
            })
            return obj
          })
        
        if (validData.length === 0) {
          toast.error('No valid data found in CSV file')
          return
        }
        
        // Validate required fields and collect errors
        const errors: string[] = []
        validData.forEach((row: Record<string, string>, index: number) => {
          const company = row.Company || row.company || row.CompanyName || row['Company Name'] || ''
          const position = row.Position || row.position || row.JobTitle || row['Job Title'] || row.Title || ''
          
          if (!company) {
            errors.push(`Row ${index + 1}: Missing Company name`)
          }
          if (!position) {
            errors.push(`Row ${index + 1}: Missing Position title`)
          }
        })
        
        if (errors.length > 0) {
          setValidationErrors(errors)
          toast.error(`Found ${errors.length} validation errors. Please fix them before importing.`)
        } else {
          setValidationErrors([])
          toast.success(`Successfully parsed ${validData.length} rows`)
        }
        
        setImportedData(validData)
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
      const applications: Application[] = []
      
      for (let i = 0; i < importedData.length; i++) {
        const row = importedData[i]
        
        // Skip rows that are clearly headers or empty
        if (!row || typeof row !== 'object') continue
        
        // Map CSV columns to Application fields with better fallbacks
        const company = row.Company || row.company || row.CompanyName || row['Company Name'] || ''
        const position = row.Position || row.position || row.JobTitle || row['Job Title'] || row.Title || ''
        
        // Validate required fields before creating the application
        if (!company.trim() || !position.trim()) {
          console.warn(`Skipping row ${i + 1}: Missing company (${company}) or position (${position})`)
          continue // Skip this row instead of throwing an error
        }
        
        const app: Application = {
          id: `imported-${Date.now()}-${i}`,
          company: company.trim(),
          position: position.trim(),
          location: (row.Location || row.location || row.City || row['City'] || '').trim(),
          type: (row.Type || row.type || row['Employment Type'] || 'Full-time') as Application['type'],
          salary: (row.Salary || row.salary || row.Compensation || row['Compensation'] || '').trim(),
          status: (row.Status || row.status || row['Application Status'] || 'Pending') as Application['status'],
          appliedDate: row['Applied Date'] || row.appliedDate || row.Date || row['Date Applied'] || new Date().toISOString().split('T')[0],
          responseDate: row['Response Date'] || row.responseDate || row['Date Responded'] || null,
          interviewDate: row['Interview Date'] || row.interviewDate || row['Date Interviewed'] || null,
          notes: (row.Notes || row.notes || row.Description || row['Job Description'] || '').trim(),
          contactPerson: (row['Contact Person'] || row.contactPerson || row.Contact || row['Contact Name'] || '').trim(),
          contactEmail: (row['Contact Email'] || row.contactEmail || row.Email || row['Email Address'] || '').trim(),
          website: (row.Website || row.website || row.URL || row['Company Website'] || '').trim(),
          tags: row.Tags ? row.Tags.split(';').map((tag: string) => tag.trim()).filter(Boolean) : [],
          priority: (row.Priority || row.priority || row['Job Priority'] || 'Medium') as Application['priority'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        applications.push(app)
      }
      
      if (applications.length === 0) {
        toast.error('No valid applications found to import. Please check your CSV format.')
        return
      }

      onImportSuccess(applications)
      setImportedData([])
      toast.success(`Successfully imported ${applications.length} applications!`)
    } catch (error) {
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Import error:', error)
    }
  }

  const downloadTemplate = () => {
    const template = [
      'Company,Position,Location,Type,Salary,Status,Applied Date,Response Date,Interview Date,Notes,Contact Person,Contact Email,Website,Tags,Priority',
      'Spotify,Software Engineer Intern,Stockholm Sweden,Internship,15000 SEK/month,Applied,2024-01-15,,,Applied through LinkedIn,Sarah Johnson,careers@spotify.com,https://spotify.com/careers,"Backend; Music; Sweden",High',
      'Klarna,Data Scientist,Stockholm Sweden,Full-time,45000 SEK/month,Pending,2024-01-20,,,Waiting for response,Marcus Andersson,careers@klarna.com,https://klarna.com/careers,"Data Science; Fintech; Sweden",Medium',
      'Ericsson,Network Engineer,Gothenburg Sweden,Full-time,40000 SEK/month,Applied,2024-01-25,,,Applied through company website,Elena Petrova,career@ericsson.com,https://ericsson.com/careers,"Networking; Telecom; Sweden",Medium'
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
                    <li>Prepare your CSV file with the required columns (Company and Position are mandatory)</li>
                    <li>Drag & drop or click to select your file</li>
                    <li>Review the parsed data preview</li>
                    <li>Click Import to add to your tracker</li>
                  </ol>
                  
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li><strong>Required:</strong> Company, Position</li>
                      <li><strong>Optional:</strong> Location, Type, Salary, Status, Applied Date, Response Date, Interview Date, Notes, Contact Person, Contact Email, Website, Tags, Priority</li>
                      <li><strong>Date Format:</strong> YYYY-MM-DD (e.g., 2024-01-15)</li>
                      <li><strong>Tags:</strong> Separate multiple tags with semicolons (e.g., "React; Python; Remote")</li>
                      <li><strong>Status Options:</strong> Pending, Applied, Interviewing, Offered, Rejected, Accepted, Withdrawn</li>
                      <li><strong>Type Options:</strong> Full-time, Part-time, Internship, Contract, Freelance</li>
                      <li><strong>Priority Options:</strong> Low, Medium, High</li>
                    </ul>
                  </div>
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

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-medium text-red-900 mb-2">
                      Validation Errors ({validationErrors.length} found):
                    </h4>
                    <ul className="text-xs text-red-800 space-y-1 max-h-32 overflow-y-auto">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-red-600">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-red-700 mt-2">
                      Please fix these errors in your CSV file and try importing again.
                    </p>
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

                {/* Import Button */}
                {importedData.length > 0 && validationErrors.length === 0 && (
                  <div className="mt-6">
                    <button
                      onClick={handleImport}
                      disabled={isProcessing || validationErrors.length > 0}
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Import {importedData.length} Applications
                    </button>
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
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
