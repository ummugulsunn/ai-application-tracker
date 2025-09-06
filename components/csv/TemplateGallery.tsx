'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  EyeIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { CSVTemplate } from '@/types/csv-import'
import { CSVTemplateSystem } from '@/lib/csv/templates'

interface TemplateGalleryProps {
  onTemplateSelect?: (template: CSVTemplate) => void
  onTemplateDownload?: (templateId: string) => void
  selectedTemplateId?: string
  showPreview?: boolean
}

export default function TemplateGallery({ 
  onTemplateSelect, 
  onTemplateDownload,
  selectedTemplateId,
  showPreview = true
}: TemplateGalleryProps) {
  const [previewTemplate, setPreviewTemplate] = useState<CSVTemplate | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const templates = CSVTemplateSystem.getAllTemplates()

  // Group templates by source
  const groupedTemplates = templates.reduce((groups, template) => {
    const source = template.source
    if (!groups[source]) {
      groups[source] = []
    }
    groups[source].push(template)
    return groups
  }, {} as Record<string, CSVTemplate[]>)

  const handleDownload = (templateId: string) => {
    try {
      // Only execute download on client side to prevent hydration issues
      if (typeof window === 'undefined' || typeof document === 'undefined') return

      const csvContent = CSVTemplateSystem.generateTemplateCSV(templateId, true)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${templateId}_template.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      onTemplateDownload?.(templateId)
    } catch (error) {
      console.error('Error downloading template:', error)
    }
  }

  const handlePreview = (template: CSVTemplate) => {
    setPreviewTemplate(template)
    setShowPreviewModal(true)
  }

  const getSourceIcon = (source: CSVTemplate['source']) => {
    switch (source) {
      case 'linkedin':
        return '💼'
      case 'indeed':
        return '🔍'
      case 'glassdoor':
        return '🏢'
      default:
        return '📋'
    }
  }

  const getSourceLabel = (source: CSVTemplate['source']) => {
    switch (source) {
      case 'linkedin':
        return 'LinkedIn'
      case 'indeed':
        return 'Indeed'
      case 'glassdoor':
        return 'Glassdoor'
      default:
        return 'Custom'
    }
  }

  const TemplateCard = ({ template }: { template: CSVTemplate }) => {
    const isSelected = selectedTemplateId === template.id
    const requiredFields = template.fieldMappings.filter(m => m.required).length
    const totalFields = template.fieldMappings.length

    return (
      <motion.div
        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'border-primary-500 bg-primary-50 shadow-md'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onTemplateSelect?.(template)}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2">
            <CheckCircleIcon className="w-6 h-6 text-primary-600 bg-white rounded-full" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getSourceIcon(template.source)}</span>
            <div>
              <h3 className="font-medium text-gray-900">{template.name}</h3>
              <p className="text-xs text-gray-500">{getSourceLabel(template.source)}</p>
            </div>
          </div>
          
          {template.source !== 'custom' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <SparklesIcon className="w-3 h-3 mr-1" />
              Official
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {template.description}
        </p>

        {/* Field count */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{totalFields} fields total</span>
          <span>{requiredFields} required</span>
        </div>

        {/* Field preview */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {template.fieldMappings.slice(0, 6).map((mapping, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                  mapping.required
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {mapping.csvColumn}
                {mapping.required && <span className="ml-1 text-red-500">*</span>}
              </span>
            ))}
            {template.fieldMappings.length > 6 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
                +{template.fieldMappings.length - 6} more
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDownload(template.id)
            }}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Download</span>
          </button>
          
          {showPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePreview(template)
              }}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">CSV Templates</h2>
        <p className="text-sm text-gray-600">
          Choose a template that matches your data format or download one to get started
        </p>
      </div>

      {/* Template groups */}
      {Object.entries(groupedTemplates).map(([source, sourceTemplates]) => (
        <div key={source}>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <span className="mr-2">{getSourceIcon(source as CSVTemplate['source'])}</span>
            {getSourceLabel(source as CSVTemplate['source'])} Templates
            <span className="ml-2 text-xs text-gray-500">({sourceTemplates.length})</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sourceTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      ))}

      {/* Help text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-800 font-medium mb-1">Template Tips:</p>
            <ul className="text-blue-700 space-y-1 text-xs">
              <li>• <strong>Required fields</strong> are marked with a red asterisk (*)</li>
              <li>• <strong>Download templates</strong> to see the exact format expected</li>
              <li>• <strong>Custom templates</strong> include all available fields for maximum flexibility</li>
              <li>• <strong>Platform templates</strong> match common export formats from job sites</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-25"
              onClick={() => setShowPreviewModal(false)}
            />

            {/* Modal */}
            <motion.div
              className="relative w-full max-w-4xl bg-white rounded-xl shadow-xl max-h-[80vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {previewTemplate.name} Preview
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {previewTemplate.description}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Field mappings */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Field Mappings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {previewTemplate.fieldMappings.map((mapping, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          mapping.required
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {mapping.csvColumn}
                          </span>
                          {mapping.required && (
                            <span className="text-xs text-red-600 font-medium">Required</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-600">
                          → {mapping.applicationField}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample data preview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Sample Data</h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {previewTemplate.sampleData[0]?.map((header, index) => (
                            <th
                              key={index}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewTemplate.sampleData.slice(1, 4).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate"
                                title={cell}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  {previewTemplate.fieldMappings.length} fields • {previewTemplate.fieldMappings.filter(m => m.required).length} required
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleDownload(previewTemplate.id)
                      setShowPreviewModal(false)
                    }}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}