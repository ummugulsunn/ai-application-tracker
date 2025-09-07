import { Application } from '@/types/application'

/**
 * Smart CSV data fixer for common issues in Erasmus applications
 */
export class SmartCSVFixer {
  
  /**
   * Auto-fix common CSV issues
   */
  static autoFixData(
    data: any[], 
    mapping: Record<string, string>
  ): { fixedData: any[]; fixes: string[] } {
    const fixedData: any[] = []
    const fixes: string[] = []

    data.forEach((row, index) => {
      const fixedRow = { ...row }
      const rowNumber = index + 1

      // Fix 1: Generate position from sector if missing
      if (this.needsPositionFix(fixedRow, mapping)) {
        const generatedPosition = this.generatePositionFromSector(fixedRow, mapping)
        if (generatedPosition) {
          // Add position to the row
          const positionColumn = mapping.position || 'Position'
          fixedRow[positionColumn] = generatedPosition
          fixes.push(`Row ${rowNumber}: Generated position "${generatedPosition}" from sector`)
        }
      }

      // Fix 2: Normalize status values
      if (this.needsStatusFix(fixedRow, mapping)) {
        const normalizedStatus = this.normalizeStatus(fixedRow, mapping)
        if (normalizedStatus) {
          const statusColumn = mapping.status
          if (statusColumn) {
            fixedRow[statusColumn] = normalizedStatus
            fixes.push(`Row ${rowNumber}: Normalized status to "${normalizedStatus}"`)
          }
        }
      }

      // Fix 3: Clean and validate email addresses
      if (this.needsEmailFix(fixedRow, mapping)) {
        const cleanedEmail = this.cleanEmail(fixedRow, mapping)
        if (cleanedEmail) {
          const emailColumn = mapping.contactEmail
          if (emailColumn) {
            fixedRow[emailColumn] = cleanedEmail
            fixes.push(`Row ${rowNumber}: Cleaned email address`)
          }
        }
      }

      // Fix 4: Standardize location names
      if (this.needsLocationFix(fixedRow, mapping)) {
        const standardizedLocation = this.standardizeLocation(fixedRow, mapping)
        if (standardizedLocation) {
          const locationColumn = mapping.location
          if (locationColumn) {
            fixedRow[locationColumn] = standardizedLocation
            fixes.push(`Row ${rowNumber}: Standardized location to "${standardizedLocation}"`)
          }
        }
      }

      fixedData.push(fixedRow)
    })

    return { fixedData, fixes }
  }

  /**
   * Check if position needs fixing
   */
  private static needsPositionFix(row: any, mapping: Record<string, string>): boolean {
    const positionColumn = mapping.position
    if (!positionColumn) return true
    
    const position = row[positionColumn]
    return !position || String(position).trim() === ''
  }

  /**
   * Generate position from sector information
   */
  private static generatePositionFromSector(row: any, mapping: Record<string, string>): string | null {
    // Try to get sector from tags or sektör column
    const tagsColumn = mapping.tags || 'Sektör'
    const sector = row[tagsColumn] || ''
    
    if (!sector) return 'Intern' // Default fallback

    const sectorLower = String(sector).toLowerCase()
    
    // Technology sectors
    if (sectorLower.includes('technology') || sectorLower.includes('tech') || sectorLower.includes('software')) {
      return 'Software Developer Intern'
    }
    if (sectorLower.includes('fintech') || sectorLower.includes('finance')) {
      return 'Finance Intern'
    }
    if (sectorLower.includes('music') || sectorLower.includes('media')) {
      return 'Media Intern'
    }
    if (sectorLower.includes('telecommunications') || sectorLower.includes('telecom')) {
      return 'Engineering Intern'
    }
    if (sectorLower.includes('automotive') || sectorLower.includes('engineering')) {
      return 'Engineering Intern'
    }
    if (sectorLower.includes('retail') || sectorLower.includes('design')) {
      return 'Design Intern'
    }
    if (sectorLower.includes('gaming') || sectorLower.includes('game')) {
      return 'Game Developer Intern'
    }
    if (sectorLower.includes('energy') || sectorLower.includes('renewable')) {
      return 'Energy Intern'
    }
    if (sectorLower.includes('maritime') || sectorLower.includes('logistics')) {
      return 'Logistics Intern'
    }
    if (sectorLower.includes('pharmaceuticals') || sectorLower.includes('medical')) {
      return 'Medical Intern'
    }
    if (sectorLower.includes('cybersecurity') || sectorLower.includes('security')) {
      return 'Security Intern'
    }
    
    // Default based on sector name
    return `${sector} Intern`
  }

  /**
   * Check if status needs fixing
   */
  private static needsStatusFix(row: any, mapping: Record<string, string>): boolean {
    const statusColumn = mapping.status
    if (!statusColumn) return false
    
    const status = row[statusColumn]
    if (!status) return false
    
    const statusLower = String(status).toLowerCase()
    const validStatuses = ['pending', 'applied', 'interviewing', 'offered', 'rejected', 'accepted', 'withdrawn']
    
    return !validStatuses.includes(statusLower)
  }

  /**
   * Normalize Turkish status values to English
   */
  private static normalizeStatus(row: any, mapping: Record<string, string>): string | null {
    const statusColumn = mapping.status
    if (!statusColumn) return null
    
    const status = String(row[statusColumn] || '').toLowerCase()
    
    // Turkish to English status mapping
    if (status.includes('başvuru yapıldı') || status.includes('başvuruldu')) return 'Applied'
    if (status.includes('mülakat') || status.includes('görüşme')) return 'Interviewing'
    if (status.includes('teklif') || status.includes('kabul edildi')) return 'Offered'
    if (status.includes('reddedildi') || status.includes('red')) return 'Rejected'
    if (status.includes('kabul ettim') || status.includes('onayladım')) return 'Accepted'
    if (status.includes('geri çektim') || status.includes('iptal')) return 'Withdrawn'
    if (status.includes('cevap bekleniyor') || status.includes('beklemede')) return 'Pending'
    if (status.includes('başvuru planlanıyor') || status.includes('planlanan')) return 'Pending'
    
    // English status normalization
    if (status.includes('applied')) return 'Applied'
    if (status.includes('interview')) return 'Interviewing'
    if (status.includes('offer')) return 'Offered'
    if (status.includes('reject')) return 'Rejected'
    if (status.includes('accept')) return 'Accepted'
    if (status.includes('withdraw')) return 'Withdrawn'
    if (status.includes('pending')) return 'Pending'
    
    return 'Pending' // Default fallback
  }

  /**
   * Check if email needs fixing
   */
  private static needsEmailFix(row: any, mapping: Record<string, string>): boolean {
    const emailColumn = mapping.contactEmail
    if (!emailColumn) return false
    
    const email = row[emailColumn]
    if (!email) return false
    
    const emailStr = String(email).trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    return emailStr.length > 0 && !emailRegex.test(emailStr)
  }

  /**
   * Clean email address
   */
  private static cleanEmail(row: any, mapping: Record<string, string>): string | null {
    const emailColumn = mapping.contactEmail
    if (!emailColumn) return null
    
    const email = String(row[emailColumn] || '').trim()
    
    // Remove common prefixes/suffixes
    let cleaned = email
      .replace(/^mailto:/i, '')
      .replace(/\s+/g, '')
      .toLowerCase()
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailRegex.test(cleaned)) {
      return cleaned
    }
    
    return null
  }

  /**
   * Check if location needs fixing
   */
  private static needsLocationFix(row: any, mapping: Record<string, string>): boolean {
    const locationColumn = mapping.location
    if (!locationColumn) return false
    
    const location = row[locationColumn]
    return location && String(location).trim().length > 0
  }

  /**
   * Standardize location names
   */
  private static standardizeLocation(row: any, mapping: Record<string, string>): string | null {
    const locationColumn = mapping.location
    if (!locationColumn) return null
    
    const location = String(row[locationColumn] || '').trim()
    
    // Country name standardization
    const countryMappings: Record<string, string> = {
      'isveç': 'Sweden',
      'sweden': 'Sweden',
      'sverige': 'Sweden',
      'norveç': 'Norway',
      'norway': 'Norway',
      'norge': 'Norway',
      'danimarka': 'Denmark',
      'denmark': 'Denmark',
      'danmark': 'Denmark',
      'almanya': 'Germany',
      'germany': 'Germany',
      'deutschland': 'Germany',
      'fransa': 'France',
      'france': 'France',
      'hollanda': 'Netherlands',
      'netherlands': 'Netherlands',
      'nederland': 'Netherlands',
      'ingiltere': 'United Kingdom',
      'uk': 'United Kingdom',
      'united kingdom': 'United Kingdom',
      'england': 'United Kingdom'
    }
    
    const locationLower = location.toLowerCase()
    
    for (const [key, value] of Object.entries(countryMappings)) {
      if (locationLower.includes(key)) {
        return value
      }
    }
    
    // Capitalize first letter of each word
    return location.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Pre-process CSV data before validation
   */
  static preprocessData(data: any[]): any[] {
    return data.map(row => {
      const processed = { ...row }
      
      // Clean all string fields and fix character encoding issues
      Object.keys(processed).forEach(key => {
        if (typeof processed[key] === 'string') {
          processed[key] = this.fixCharacterEncoding(processed[key].trim())
        }
      })
      
      return processed
    })
  }

  /**
   * Fix common character encoding issues (especially Turkish characters)
   */
  private static fixCharacterEncoding(text: string): string {
    if (!text) return text

    let fixed = text

    // Apply sequential fixes to avoid conflicts
    const fixes = [
      // Most specific country fixes first
      ['Ä°sveÃ§', 'İsveç'],
      ['NorveÃ§', 'Norveç'],
      ['DanimarkaÃ§', 'Danimarkac'],
      ['AlmanyaÃ§', 'Almanyac'],
      ['FransaÃ§', 'Fransac'],
      ['HollandaÃ§', 'Hollandac'],
      ['Ä°ngilterÃ§', 'İngilterç'],
      
      // Common Turkish words
      ['Ã§alÄ±ÅŸma', 'çalışma'],
      ['Ã¶Ä±renci', 'öğrenci'],
      ['Ã¼niversite', 'üniversite'],
      ['baÅŸvuru', 'başvuru'],
      ['Ã¶Ä±retim', 'öğretim'],
      ['gÃ¶nderim', 'gönderim'],
      ['Ã¼lke', 'ülke'],
      ['Ã§eÅŸit', 'çeşit'],
      ['Ã¶nemli', 'önemli'],
      ['Ã¼cret', 'ücret'],
      ['Ã§Ä±karÄ±m', 'çıkarım'],
      ['Ã¶Ä±retmen', 'öğretmen'],
      ['Ã¼retici', 'üretici'],
      ['Ã§Ä±kÄ±ÅŸ', 'çıkış'],
      ['Ã¶Ä±retici', 'öğretici'],
      ['Ã¼nvan', 'ünvan'],
      ['Ã§eÅŸitli', 'çeşitli'],
      ['Ã¼niversitesi', 'üniversitesi'],
      ['Ã§alÄ±ÅŸan', 'çalışan'],
      ['Ã¶Ä±rencisi', 'öğrencisi'],
      ['Ã¼niversitede', 'üniversitede'],
      ['Ã§alÄ±ÅŸmak', 'çalışmak'],
      ['Ã¶Ä±renmek', 'öğrenmek'],
      ['Ã¼niversiteye', 'üniversiteye'],
      ['Ã§alÄ±ÅŸtÄ±', 'çalıştı'],
      ['Ã¶Ä±rendi', 'öğrendi'],
      ['Ã¼niversiteli', 'üniversiteli'],
      
      // Individual character fixes
      ['Ä°', 'İ'],
      ['Ã§', 'ç'],
      ['Ã¶', 'ö'],
      ['Ã¼', 'ü'],
      ['Ä±', 'ı'],
      ['Åž', 'ş'],
      ['Ã¤', 'ä'],
      ['Ã¥', 'å'],
      ['Ã¦', 'æ'],
      ['Ã¸', 'ø'],
      ['Ã©', 'é'],
      ['Ã¡', 'á'],
      ['Ã­', 'í'],
      ['Ã³', 'ó'],
      ['Ãº', 'ú'],
      ['Ã±', 'ñ']
    ]

    // Apply fixes sequentially
    for (const [wrong, correct] of fixes) {
      if (wrong && correct) {
        fixed = fixed.replace(new RegExp(wrong, 'g'), correct)
      }
    }

    // Additional cleanup for common patterns
    fixed = fixed
      // Fix common UTF-8 to Latin-1 double encoding issues
      .replace(/Ã¢â‚¬â„¢/g, "'")
      .replace(/Ã¢â‚¬Å"/g, '"')
      .replace(/Ã¢â‚¬Â/g, '"')
      .replace(/Ã¢â‚¬Ëœ/g, "'")
      // Fix other common encoding issues
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/â€˜/g, "'")
      // Clean up any remaining weird characters
      .replace(/[^\x00-\x7F\u00C0-\u017F\u0100-\u024F]/g, '')

    return fixed
  }
}