/**
 * Comprehensive Export Service
 * Handles CSV, Excel, PDF, and JSON exports with custom field selection
 */

import { Application, ApplicationStats } from '@/types/application'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface ExportField {
  key: keyof Application | 'customField'
  label: string
  selected: boolean
  type: 'string' | 'date' | 'number' | 'array' | 'object'
  formatter?: (value: any) => string
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json'
  fields: ExportField[]
  includeStats?: boolean
  includeAIInsights?: boolean
  dateRange?: {
    start: string | null
    end: string | null
  }
  customFilename?: string
}

export interface ExportResult {
  success: boolean
  filename: string
  data?: Blob | string
  error?: string
}

export class ExportService {
  private static readonly DEFAULT_FIELDS: ExportField[] = [
    { key: 'company', label: 'Company', selected: true, type: 'string' },
    { key: 'position', label: 'Position', selected: true, type: 'string' },
    { key: 'location', label: 'Location', selected: true, type: 'string' },
    { key: 'type', label: 'Job Type', selected: true, type: 'string' },
    { key: 'salary', label: 'Salary', selected: true, type: 'string' },
    { key: 'status', label: 'Status', selected: true, type: 'string' },
    { key: 'priority', label: 'Priority', selected: true, type: 'string' },
    { key: 'appliedDate', label: 'Applied Date', selected: true, type: 'date' },
    { key: 'responseDate', label: 'Response Date', selected: false, type: 'date' },
    { key: 'interviewDate', label: 'Interview Date', selected: false, type: 'date' },
    { key: 'offerDate', label: 'Offer Date', selected: false, type: 'date' },
    { key: 'rejectionDate', label: 'Rejection Date', selected: false, type: 'date' },
    { key: 'followUpDate', label: 'Follow Up Date', selected: false, type: 'date' },
    { key: 'contactPerson', label: 'Contact Person', selected: false, type: 'string' },
    { key: 'contactEmail', label: 'Contact Email', selected: false, type: 'string' },
    { key: 'contactPhone', label: 'Contact Phone', selected: false, type: 'string' },
    { key: 'website', label: 'Website', selected: false, type: 'string' },
    { key: 'jobUrl', label: 'Job URL', selected: false, type: 'string' },
    { key: 'companyWebsite', label: 'Company Website', selected: false, type: 'string' },
    { key: 'notes', label: 'Notes', selected: false, type: 'string' },
    { key: 'jobDescription', label: 'Job Description', selected: false, type: 'string' },
    { key: 'requirements', label: 'Requirements', selected: false, type: 'array', 
      formatter: (value: string[]) => value?.join('; ') || '' },
    { key: 'tags', label: 'Tags', selected: false, type: 'array',
      formatter: (value: string[]) => value?.join('; ') || '' },
    { key: 'aiMatchScore', label: 'AI Match Score', selected: false, type: 'number' },
    { key: 'createdAt', label: 'Created At', selected: false, type: 'date' },
    { key: 'updatedAt', label: 'Updated At', selected: false, type: 'date' }
  ]

  static getDefaultFields(): ExportField[] {
    return [...this.DEFAULT_FIELDS]
  }

  static async exportApplications(
    applications: Application[],
    options: ExportOptions,
    stats?: ApplicationStats
  ): Promise<ExportResult> {
    try {
      const selectedFields = options.fields.filter(field => field.selected)
      const filteredApplications = this.filterApplicationsByDateRange(applications, options.dateRange)

      switch (options.format) {
        case 'csv':
          return this.exportToCSV(filteredApplications, selectedFields, options)
        case 'excel':
          return this.exportToExcel(filteredApplications, selectedFields, options, stats)
        case 'pdf':
          return this.exportToPDF(filteredApplications, selectedFields, options, stats)
        case 'json':
          return this.exportToJSON(filteredApplications, selectedFields, options, stats)
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown export error'
      }
    }
  }

  private static filterApplicationsByDateRange(
    applications: Application[],
    dateRange?: { start: string | null; end: string | null }
  ): Application[] {
    if (!dateRange || (!dateRange.start && !dateRange.end)) {
      return applications
    }

    return applications.filter(app => {
      const appliedDate = new Date(app.appliedDate)
      const start = dateRange.start ? new Date(dateRange.start) : null
      const end = dateRange.end ? new Date(dateRange.end) : null

      if (start && appliedDate < start) return false
      if (end && appliedDate > end) return false
      return true
    })
  }

  private static exportToCSV(
    applications: Application[],
    fields: ExportField[],
    options: ExportOptions
  ): ExportResult {
    const headers = fields.map(field => field.label)
    const rows = applications.map(app => 
      fields.map(field => this.formatFieldValue(app, field))
    )

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const filename = options.customFilename || `applications_export_${new Date().toISOString().split('T')[0]}.csv`

    return {
      success: true,
      filename,
      data: csvContent
    }
  }

  private static exportToExcel(
    applications: Application[],
    fields: ExportField[],
    options: ExportOptions,
    stats?: ApplicationStats
  ): ExportResult {
    const workbook = XLSX.utils.book_new()

    // Applications sheet
    const headers = fields.map(field => field.label)
    const rows = applications.map(app => 
      fields.map(field => this.formatFieldValue(app, field))
    )

    const worksheetData = [headers, ...rows]
    const applicationsSheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Auto-size columns
    const colWidths = headers.map((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...rows.map(row => String(row[index] || '').length)
      )
      return { wch: Math.min(maxLength + 2, 50) }
    })
    applicationsSheet['!cols'] = colWidths

    XLSX.utils.book_append_sheet(workbook, applicationsSheet, 'Applications')

    // Stats sheet (if requested and available)
    if (options.includeStats && stats) {
      const statsData = [
        ['Metric', 'Value'],
        ['Total Applications', stats.total],
        ['Pending', stats.pending],
        ['Applied', stats.applied],
        ['Interviewing', stats.interviewing],
        ['Offered', stats.offered],
        ['Rejected', stats.rejected],
        ['Accepted', stats.accepted],
        ['Success Rate (%)', stats.successRate],
        ['Average Response Time (days)', stats.averageResponseTime],
        ['AI Analyzed Count', stats.aiAnalyzedCount],
        ['Average Match Score', stats.averageMatchScore],
        ['High Potential Count', stats.highPotentialCount]
      ]

      const statsSheet = XLSX.utils.aoa_to_sheet(statsData)
      statsSheet['!cols'] = [{ wch: 25 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics')
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })

    const filename = options.customFilename || `applications_export_${new Date().toISOString().split('T')[0]}.xlsx`

    return {
      success: true,
      filename,
      data: blob
    }
  }

  private static exportToPDF(
    applications: Application[],
    fields: ExportField[],
    options: ExportOptions,
    stats?: ApplicationStats
  ): ExportResult {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const margin = 20

    // Title
    doc.setFontSize(20)
    doc.text('Job Applications Report', margin, 30)

    // Date range (if specified)
    if (options.dateRange?.start || options.dateRange?.end) {
      doc.setFontSize(12)
      const dateText = `Date Range: ${options.dateRange.start || 'All'} to ${options.dateRange.end || 'All'}`
      doc.text(dateText, margin, 45)
    }

    let yPosition = options.dateRange?.start || options.dateRange?.end ? 60 : 50

    // Statistics summary (if requested and available)
    if (options.includeStats && stats) {
      doc.setFontSize(16)
      doc.text('Summary Statistics', margin, yPosition)
      yPosition += 15

      doc.setFontSize(10)
      const statsText = [
        `Total Applications: ${stats.total}`,
        `Success Rate: ${stats.successRate}%`,
        `Average Response Time: ${stats.averageResponseTime} days`,
        `AI Analyzed: ${stats.aiAnalyzedCount}`,
        `Average Match Score: ${stats.averageMatchScore}`
      ]

      statsText.forEach(text => {
        doc.text(text, margin, yPosition)
        yPosition += 8
      })

      yPosition += 10
    }

    // Applications table
    doc.setFontSize(14)
    doc.text('Applications', margin, yPosition)
    yPosition += 10

    const headers = fields.map(field => field.label)
    const rows = applications.map(app => 
      fields.map(field => this.formatFieldValue(app, field, true))
    )

    // Use autoTable for better table formatting
    ;(doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: this.getPDFColumnStyles(fields),
      didDrawPage: (data: any) => {
        // Add page numbers
        const pageNumber = (doc as any).internal.getCurrentPageInfo().pageNumber
        doc.setFontSize(10)
        doc.text(
          `Page ${pageNumber}`,
          pageWidth - margin - 20,
          doc.internal.pageSize.height - 10
        )
      }
    })

    const pdfBlob = new Blob([doc.output('blob')], { type: 'application/pdf' })
    const filename = options.customFilename || `applications_report_${new Date().toISOString().split('T')[0]}.pdf`

    return {
      success: true,
      filename,
      data: pdfBlob
    }
  }

  private static exportToJSON(
    applications: Application[],
    fields: ExportField[],
    options: ExportOptions,
    stats?: ApplicationStats
  ): ExportResult {
    const exportData: any = {
      exportDate: new Date().toISOString(),
      totalRecords: applications.length,
      fields: fields.map(f => ({ key: f.key, label: f.label })),
      applications: applications.map(app => {
        const exportApp: any = {}
        fields.forEach(field => {
          exportApp[field.key] = app[field.key as keyof Application]
        })
        return exportApp
      })
    }

    if (options.includeStats && stats) {
      exportData.statistics = stats
    }

    if (options.includeAIInsights) {
      exportData.applications = exportData.applications.map((app: any, index: number) => ({
        ...app,
        aiInsights: applications[index]?.aiInsights
      }))
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const filename = options.customFilename || `applications_export_${new Date().toISOString().split('T')[0]}.json`

    return {
      success: true,
      filename,
      data: jsonString
    }
  }

  private static formatFieldValue(
    app: Application,
    field: ExportField,
    forPDF: boolean = false
  ): string {
    const value = app[field.key as keyof Application]

    if (value === null || value === undefined) {
      return ''
    }

    if (field.formatter) {
      return field.formatter(value)
    }

    switch (field.type) {
      case 'date':
        return value ? new Date(value as string).toLocaleDateString() : ''
      case 'array':
        return Array.isArray(value) ? value.join('; ') : String(value)
      case 'object':
        return typeof value === 'object' ? JSON.stringify(value) : String(value)
      default:
        const stringValue = String(value)
        // Truncate long text for PDF to prevent layout issues
        return forPDF && stringValue.length > 50 
          ? stringValue.substring(0, 47) + '...'
          : stringValue
    }
  }

  private static getPDFColumnStyles(fields: ExportField[]): Record<number, any> {
    const styles: Record<number, any> = {}
    
    fields.forEach((field, index) => {
      switch (field.type) {
        case 'date':
          styles[index] = { cellWidth: 25 }
          break
        case 'string':
          if (field.key === 'notes' || field.key === 'jobDescription') {
            styles[index] = { cellWidth: 40 }
          } else {
            styles[index] = { cellWidth: 30 }
          }
          break
        case 'number':
          styles[index] = { cellWidth: 20, halign: 'right' }
          break
        default:
          styles[index] = { cellWidth: 30 }
      }
    })

    return styles
  }

  static downloadFile(data: Blob | string, filename: string): void {
    const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
}