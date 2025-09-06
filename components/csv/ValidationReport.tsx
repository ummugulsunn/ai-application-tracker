'use client'

import { motion } from 'framer-motion'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { ValidationError, ValidationWarning } from '@/types/csv-import'
import { DuplicateGroup } from '@/lib/csv/duplicate-detector'

interface ValidationReportProps {
  totalRows: number
  errors: ValidationError[]
  warnings: ValidationWarning[]
  duplicateGroups: DuplicateGroup[]
  validationSummary: {
    totalIssues: number
    criticalErrors: number
    warnings: number
    canProceed: boolean
    summary: string
    recommendations: string[]
  }
  onProceed?: () => void
  onShowDetails?: () => void
}

export default function ValidationReport({
  totalRows,
  errors,
  warnings,
  duplicateGroups,
  validationSummary,
  onProceed,
  onShowDetails
}: ValidationReportProps) {
  const { canProceed, summary, recommendations } = validationSummary
  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.applications.length - 1, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {canProceed ? (
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          ) : (
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          )}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Validation Report</h3>
            <p className="text-sm text-gray-600">{totalRows.toLocaleString()} rows analyzed</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {onShowDetails && (
            <button
              onClick={onShowDetails}
              className="btn-secondary text-sm flex items-center space-x-2"
            >
              <DocumentCheckIcon className="w-4 h-4" />
              <span>View Details</span>
            </button>
          )}
          {canProceed && onProceed && (
            <button
              onClick={onProceed}
              className="btn-primary flex items-center space-x-2"
            >
              <span>Proceed with Import</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className={`p-4 rounded-lg border ${
        canProceed 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <p className={`text-sm font-medium ${
          canProceed ? 'text-green-800' : 'text-red-800'
        }`}>
          {summary}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<CheckCircleIcon className="w-6 h-6 text-green-600" />}
          label="Valid Rows"
          value={totalRows - errors.length}
          total={totalRows}
          color="green"
        />
        <MetricCard
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-red-600" />}
          label="Critical Errors"
          value={errors.length}
          color="red"
        />
        <MetricCard
          icon={<InformationCircleIcon className="w-6 h-6 text-yellow-600" />}
          label="Warnings"
          value={warnings.length}
          color="yellow"
        />
        <MetricCard
          icon={<ChartBarIcon className="w-6 h-6 text-blue-600" />}
          label="Duplicates"
          value={totalDuplicates}
          color="blue"
        />
      </div>

      {/* Issue Breakdown */}
      {(errors.length > 0 || warnings.length > 0 || duplicateGroups.length > 0) && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Issue Breakdown</h4>
          
          {/* Error Categories */}
          {errors.length > 0 && (
            <IssueCategory
              title="Critical Errors"
              count={errors.length}
              color="red"
              issues={groupIssuesByType(errors)}
            />
          )}

          {/* Warning Categories */}
          {warnings.length > 0 && (
            <IssueCategory
              title="Warnings (Auto-corrected)"
              count={warnings.length}
              color="yellow"
              issues={groupIssuesByType(warnings)}
            />
          )}

          {/* Duplicate Categories */}
          {duplicateGroups.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-blue-900 mb-2">
                Duplicate Groups ({duplicateGroups.length})
              </h5>
              <div className="space-y-2">
                {duplicateGroups.slice(0, 3).map((group, index) => (
                  <div key={index} className="text-xs text-blue-700">
                    • Group {index + 1}: {group.applications.length} similar applications 
                    ({Math.round(group.confidence * 100)}% confidence)
                  </div>
                ))}
                {duplicateGroups.length > 3 && (
                  <div className="text-xs text-blue-600">
                    ... and {duplicateGroups.length - 3} more groups
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recommendations</h4>
          <ul className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                <span className="text-primary-600 mt-1">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Required Message */}
      {!canProceed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">Action Required</h4>
              <p className="text-sm text-red-700">
                Please fix the critical errors in your CSV file and re-upload to proceed with the import.
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Helper function to group issues by type
function groupIssuesByType(issues: (ValidationError | ValidationWarning)[]): Record<string, number> {
  return issues.reduce((acc, issue) => {
    acc[issue.column] = (acc[issue.column] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

// Metric Card Component
function MetricCard({ 
  icon, 
  label, 
  value, 
  total, 
  color 
}: {
  icon: React.ReactNode
  label: string
  value: number
  total?: number
  color: 'green' | 'red' | 'yellow' | 'blue'
}) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    blue: 'bg-blue-50 border-blue-200'
  }

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center space-x-3">
        {icon}
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-lg font-semibold text-gray-900">
            {value.toLocaleString()}
            {total && <span className="text-sm text-gray-600">/{total.toLocaleString()}</span>}
          </p>
        </div>
      </div>
    </div>
  )
}

// Issue Category Component
function IssueCategory({ 
  title, 
  count, 
  color, 
  issues 
}: {
  title: string
  count: number
  color: 'red' | 'yellow'
  issues: Record<string, number>
}) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900'
  }

  const textColorClasses = {
    red: 'text-red-700',
    yellow: 'text-yellow-700'
  }

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <h5 className="text-sm font-medium mb-2">
        {title} ({count})
      </h5>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Object.entries(issues).map(([type, typeCount]) => (
          <div key={type} className={`text-xs ${textColorClasses[color]}`}>
            {type}: {typeCount}
          </div>
        ))}
      </div>
    </div>
  )
}