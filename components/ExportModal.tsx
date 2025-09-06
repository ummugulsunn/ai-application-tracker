'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { 
  XMarkIcon, 
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ChartBarIcon,
  CalendarIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ExportService, ExportField, ExportOptions } from '@/lib/export/exportService'
import { Application, ApplicationStats } from '@/types/application'
import { useApplicationStore } from '@/store/applicationStore'
import toast from 'react-hot-toast'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  applications: Application[]
  stats?: ApplicationStats
}

export function ExportModal({ isOpen, onClose, applications, stats }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'pdf' | 'json'>('csv')
  const [fields, setFields] = useState<ExportField[]>([])
  const [includeStats, setIncludeStats] = useState(false)
  const [includeAIInsights, setIncludeAIInsights] = useState(false)
  const [customFilename, setCustomFilename] = useState('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  })
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFields(ExportService.getDefaultFields())
      setCustomFilename('')
      setDateRange({ start: '', end: '' })
      setIncludeStats(false)
      setIncludeAIInsights(false)
    }
  }, [isOpen])

  const formatOptions = [
    {
      id: 'csv' as const,
      name: 'CSV',
      description: 'Comma-separated values for spreadsheet applications',
      icon: TableCellsIcon,
      extension: '.csv'
    },
    {
      id: 'excel' as const,
      name: 'Excel',
      description: 'Microsoft Excel workbook with formatting',
      icon: DocumentTextIcon,
      extension: '.xlsx'
    },
    {
      id: 'pdf' as const,
      name: 'PDF Report',
      description: 'Professional report with statistics and formatting',
      icon: DocumentArrowDownIcon,
      extension: '.pdf'
    },
    {
      id: 'json' as const,
      name: 'JSON',
      description: 'Structured data for developers and integrations',
      icon: CodeBracketIcon,
      extension: '.json'
    }
  ]

  const handleFieldToggle = (fieldKey: string) => {
    setFields(prev => prev.map(field => 
      field.key === fieldKey 
        ? { ...field, selected: !field.selected }
        : field
    ))
  }

  const handleSelectAll = () => {
    const allSelected = fields.every(field => field.selected)
    setFields(prev => prev.map(field => ({ ...field, selected: !allSelected })))
  }

  const handleExport = async () => {
    const selectedFields = fields.filter(field => field.selected)
    
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to export')
      return
    }

    setIsExporting(true)

    try {
      const options: ExportOptions = {
        format: selectedFormat,
        fields,
        includeStats: includeStats && !!stats,
        includeAIInsights,
        dateRange: dateRange.start || dateRange.end ? {
          start: dateRange.start || null,
          end: dateRange.end || null
        } : undefined,
        customFilename
      }

      const result = await ExportService.exportApplications(applications, options, stats)

      if (result.success && result.data) {
        ExportService.downloadFile(result.data, result.filename)
        toast.success(`Successfully exported ${applications.length} applications`)
        onClose()
      } else {
        toast.error(result.error || 'Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const getPreviewText = () => {
    const selectedCount = fields.filter(f => f.selected).length
    const recordCount = applications.length
    return `${recordCount} applications, ${selectedCount} fields`
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Export Applications
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Format Selection */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Export Format</h4>
                      <div className="space-y-2">
                        {formatOptions.map((format) => (
                          <label
                            key={format.id}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedFormat === format.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="format"
                              value={format.id}
                              checked={selectedFormat === format.id}
                              onChange={(e) => setSelectedFormat(e.target.value as any)}
                              className="sr-only"
                            />
                            <format.icon className="h-5 w-5 text-gray-400 mr-3" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {format.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format.description}
                              </div>
                            </div>
                            {selectedFormat === format.id && (
                              <CheckIcon className="h-5 w-5 text-blue-500" />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Options */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Export Options</h4>
                      <div className="space-y-3">
                        {stats && (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={includeStats}
                              onChange={(e) => setIncludeStats(e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Include statistics summary
                            </span>
                          </label>
                        )}
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={includeAIInsights}
                            onChange={(e) => setIncludeAIInsights(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Include AI insights data
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Date Range Filter</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">From</label>
                          <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">To</label>
                          <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Custom Filename */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Custom Filename (optional)
                      </label>
                      <Input
                        type="text"
                        value={customFilename}
                        onChange={(e) => setCustomFilename(e.target.value)}
                        placeholder={`applications_export_${new Date().toISOString().split('T')[0]}`}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Right Column - Field Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Select Fields</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {fields.every(f => f.selected) ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg max-h-80 overflow-y-auto">
                      <div className="p-3 space-y-2">
                        {fields.map((field) => (
                          <label
                            key={field.key}
                            className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={field.selected}
                              onChange={() => handleFieldToggle(field.key)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 flex-1">
                              {field.label}
                            </span>
                            <span className="text-xs text-gray-400 capitalize">
                              {field.type}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Export Preview</div>
                      <div className="text-sm text-gray-700">{getPreviewText()}</div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    {applications.length} applications ready for export
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleExport}
                      disabled={isExporting || fields.filter(f => f.selected).length === 0}
                      className="min-w-[120px]"
                    >
                      {isExporting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Exporting...
                        </div>
                      ) : (
                        <>
                          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                          Export {selectedFormat.toUpperCase()}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}