'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LinkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface JobUrlParserProps {
  onDataExtracted: (data: {
    company?: string
    position?: string
    location?: string
    jobDescription?: string
    requirements?: string[]
    companyWebsite?: string
    jobUrl: string
  }) => void
  className?: string
}

interface ParsedJobData {
  company?: string
  position?: string
  location?: string
  jobDescription?: string
  requirements?: string[]
  companyWebsite?: string
  source: string
}

export default function JobUrlParser({ onDataExtracted, className = '' }: JobUrlParserProps) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedJobData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUrlParse = async () => {
    if (!url.trim()) {
      setError('Please enter a job URL')
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setIsLoading(true)
    setError(null)
    setParsedData(null)

    try {
      const response = await fetch('/api/suggestions/job-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      })

      const data = await response.json()

      if (data.success) {
        setParsedData(data.data)
        
        // Show success message if we extracted useful data
        const extractedFields = Object.keys(data.data).filter(key => 
          key !== 'source' && key !== 'companyWebsite' && data.data[key]
        )
        
        if (extractedFields.length > 0) {
          toast.success(`Extracted ${extractedFields.length} field${extractedFields.length > 1 ? 's' : ''} from job URL`)
        } else {
          toast('No additional information could be extracted from this URL', {
            icon: '⚠️'
          })
        }
      } else {
        setError(data.error?.message || 'Failed to parse job URL')
        toast.error('Failed to parse job URL')
      }
    } catch (error) {
      console.error('Error parsing job URL:', error)
      setError('Failed to parse job URL. Please try again.')
      toast.error('Failed to parse job URL')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseData = () => {
    if (parsedData) {
      onDataExtracted({
        ...parsedData,
        jobUrl: url
      })
      
      // Reset the component
      setUrl('')
      setParsedData(null)
      setError(null)
      
      toast.success('Job information applied to form')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleUrlParse()
    }
  }

  const getSupportedSites = () => [
    'LinkedIn Jobs',
    'Indeed',
    'Glassdoor',
    'Wellfound (AngelList)',
    'Company career pages'
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <LinkIcon className="w-4 h-4 inline mr-1" />
          Parse Job URL
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Paste a job URL to automatically extract company, position, and other details
        </p>
        
        <div className="flex space-x-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://linkedin.com/jobs/view/123456789"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleUrlParse}
            disabled={isLoading || !url.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Parsing...</span>
              </>
            ) : (
              <span>Parse</span>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-2 flex items-center space-x-2 text-red-600">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {parsedData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border border-green-200 bg-green-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-800">
                  Extracted Information
                </h4>
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                Source: {parsedData.source}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {parsedData.company && (
                <div>
                  <span className="text-xs font-medium text-gray-500">Company</span>
                  <p className="text-sm text-gray-900">{parsedData.company}</p>
                </div>
              )}
              
              {parsedData.position && (
                <div>
                  <span className="text-xs font-medium text-gray-500">Position</span>
                  <p className="text-sm text-gray-900">{parsedData.position}</p>
                </div>
              )}
              
              {parsedData.location && (
                <div>
                  <span className="text-xs font-medium text-gray-500">Location</span>
                  <p className="text-sm text-gray-900">{parsedData.location}</p>
                </div>
              )}
              
              {parsedData.companyWebsite && (
                <div>
                  <span className="text-xs font-medium text-gray-500">Company Website</span>
                  <p className="text-sm text-gray-900 truncate">{parsedData.companyWebsite}</p>
                </div>
              )}
            </div>

            {parsedData.requirements && parsedData.requirements.length > 0 && (
              <div className="mb-4">
                <span className="text-xs font-medium text-gray-500">Requirements</span>
                <ul className="text-sm text-gray-900 list-disc list-inside mt-1">
                  {parsedData.requirements.slice(0, 3).map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                  {parsedData.requirements.length > 3 && (
                    <li className="text-gray-500">
                      +{parsedData.requirements.length - 3} more requirements
                    </li>
                  )}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={handleUseData}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            >
              Use This Information
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-xs text-gray-500">
        <p className="font-medium mb-1">Supported job sites:</p>
        <ul className="list-disc list-inside space-y-0.5">
          {getSupportedSites().map((site, index) => (
            <li key={index}>{site}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}