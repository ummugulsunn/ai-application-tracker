import { EncodingDetectionResult } from '@/types/csv-import'

/**
 * Detects CSV file encoding by analyzing byte patterns and character frequencies
 */
export class EncodingDetector {
  private static readonly SAMPLE_SIZE = 8192 // First 8KB for analysis

  /**
   * Detect encoding from file buffer
   */
  static async detectEncoding(file: File): Promise<EncodingDetectionResult> {
    const buffer = await this.readFileBuffer(file, this.SAMPLE_SIZE)
    const results = await Promise.all([
      this.testUTF8(buffer),
      this.testISO88591(buffer),
      this.testWindows1252(buffer),
      this.testTurkishEncoding(buffer)
    ])

    // Sort by confidence and return the best match
    results.sort((a, b) => b.confidence - a.confidence)
    
    // If no encoding has high confidence, default to UTF-8
    const bestResult = results[0]!
    if (bestResult.confidence < 0.3) {
      return {
        encoding: 'utf-8',
        confidence: 0.5,
        sample: 'Defaulting to UTF-8'
      }
    }
    
    return bestResult
  }

  /**
   * Read file buffer for analysis
   */
  private static readFileBuffer(file: File, size: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      
      const blob = file.slice(0, size)
      reader.readAsArrayBuffer(blob)
    })
  }

  /**
   * Test UTF-8 encoding
   */
  private static async testUTF8(buffer: ArrayBuffer): Promise<EncodingDetectionResult> {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    
    try {
      const text = decoder.decode(buffer)
      const confidence = this.calculateUTF8Confidence(text, buffer)
      
      return {
        encoding: 'utf-8',
        confidence,
        sample: text.substring(0, 200)
      }
    } catch (error) {
      return {
        encoding: 'utf-8',
        confidence: 0,
        sample: ''
      }
    }
  }

  /**
   * Test ISO-8859-1 encoding
   */
  private static async testISO88591(buffer: ArrayBuffer): Promise<EncodingDetectionResult> {
    const decoder = new TextDecoder('iso-8859-1')
    const text = decoder.decode(buffer)
    const confidence = this.calculateISO88591Confidence(text)
    
    return {
      encoding: 'iso-8859-1',
      confidence,
      sample: text.substring(0, 200)
    }
  }

  /**
   * Test Windows-1252 encoding
   */
  private static async testWindows1252(buffer: ArrayBuffer): Promise<EncodingDetectionResult> {
    const decoder = new TextDecoder('windows-1252')
    const text = decoder.decode(buffer)
    const confidence = this.calculateWindows1252Confidence(text)
    
    return {
      encoding: 'windows-1252',
      confidence,
      sample: text.substring(0, 200)
    }
  }

  /**
   * Calculate UTF-8 confidence based on valid sequences and BOM
   */
  private static calculateUTF8Confidence(text: string, buffer: ArrayBuffer): number {
    let confidence = 0.3 // Base confidence
    
    // Check for BOM
    const bytes = new Uint8Array(buffer)
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      confidence += 0.5
    }
    
    // Check for valid UTF-8 characters
    const utf8Chars = text.match(/[\u0080-\uFFFF]/g)
    if (utf8Chars) {
      confidence += Math.min(0.3, utf8Chars.length / text.length)
    }
    
    // Check for common CSV patterns
    if (this.hasCommonCSVPatterns(text)) {
      confidence += 0.1
    }
    
    return Math.min(1, confidence)
  }

  /**
   * Calculate ISO-8859-1 confidence
   */
  private static calculateISO88591Confidence(text: string): number {
    let confidence = 0.2 // Base confidence
    
    // Check for extended ASCII characters (128-255)
    const extendedChars = text.match(/[\u0080-\u00FF]/g)
    if (extendedChars) {
      confidence += Math.min(0.4, extendedChars.length / text.length * 2)
    }
    
    // Check for common European characters
    const europeanChars = text.match(/[àáâãäåæçèéêëìíîïñòóôõöøùúûüý]/gi)
    if (europeanChars) {
      confidence += Math.min(0.3, europeanChars.length / text.length * 5)
    }
    
    // Check for common CSV patterns
    if (this.hasCommonCSVPatterns(text)) {
      confidence += 0.1
    }
    
    return Math.min(1, confidence)
  }

  /**
   * Calculate Windows-1252 confidence
   */
  private static calculateWindows1252Confidence(text: string): number {
    let confidence = 0.2 // Base confidence
    
    // Check for Windows-1252 specific characters (128-159 range)
    const win1252Chars = text.match(/[\u0080-\u009F]/g)
    if (win1252Chars) {
      confidence += Math.min(0.4, win1252Chars.length / text.length * 10)
    }
    
    // Check for smart quotes and other Windows-specific chars
    const smartChars = text.match(/[""''–—]/g)
    if (smartChars) {
      confidence += Math.min(0.2, smartChars.length / text.length * 5)
    }
    
    // Check for common CSV patterns
    if (this.hasCommonCSVPatterns(text)) {
      confidence += 0.1
    }
    
    return Math.min(1, confidence)
  }

  /**
   * Check for common CSV patterns
   */
  private static hasCommonCSVPatterns(text: string): boolean {
    // Look for comma-separated values, quoted fields, etc.
    const csvPatterns = [
      /,/g, // Commas
      /"/g, // Quotes
      /\r?\n/g, // Line breaks
      /^[^,\n]*,[^,\n]*,[^,\n]*/m // At least 3 comma-separated fields
    ]
    
    return csvPatterns.some(pattern => pattern.test(text))
  }

  /**
   * Test Turkish encoding (ISO-8859-9 / Windows-1254)
   */
  private static async testTurkishEncoding(buffer: ArrayBuffer): Promise<EncodingDetectionResult> {
    // Try Windows-1254 first (more common for Turkish)
    try {
      const decoder = new TextDecoder('windows-1254')
      const text = decoder.decode(buffer)
      const confidence = this.calculateTurkishConfidence(text)
      
      return {
        encoding: 'windows-1254',
        confidence,
        sample: text.substring(0, 200)
      }
    } catch (error) {
      // Fallback to ISO-8859-9
      try {
        const decoder = new TextDecoder('iso-8859-9')
        const text = decoder.decode(buffer)
        const confidence = this.calculateTurkishConfidence(text) * 0.8 // Slightly lower confidence
        
        return {
          encoding: 'iso-8859-9',
          confidence,
          sample: text.substring(0, 200)
        }
      } catch (error) {
        return {
          encoding: 'windows-1254',
          confidence: 0,
          sample: ''
        }
      }
    }
  }

  /**
   * Calculate Turkish encoding confidence
   */
  private static calculateTurkishConfidence(text: string): number {
    let confidence = 0.1 // Base confidence
    
    // Check for Turkish-specific characters
    const turkishChars = text.match(/[çğıöşüÇĞIİÖŞÜ]/g)
    if (turkishChars) {
      confidence += Math.min(0.6, turkishChars.length / text.length * 10)
    }
    
    // Check for Turkish words
    const turkishWords = text.match(/\b(şirket|adı|ülke|sektör|durum|tarih|bilgi|notlar|başvuru|cevap|iletişim)\b/gi)
    if (turkishWords) {
      confidence += Math.min(0.4, turkishWords.length / 20)
    }
    
    // Check for common CSV patterns
    if (this.hasCommonCSVPatterns(text)) {
      confidence += 0.1
    }
    
    return Math.min(1, confidence)
  }

  /**
   * Read file with detected encoding
   */
  static async readFileWithEncoding(file: File, encoding: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const buffer = reader.result as ArrayBuffer
          
          // Try multiple encodings if the detected one fails
          const encodingsToTry = [
            encoding,
            'utf-8',
            'windows-1254', // Turkish
            'iso-8859-9',   // Turkish
            'windows-1252', // Western European
            'iso-8859-1'    // Latin-1
          ]
          
          let text = ''
          let success = false
          
          for (const enc of encodingsToTry) {
            try {
              const decoder = new TextDecoder(enc, { fatal: true })
              text = decoder.decode(buffer)
              success = true
              break
            } catch (error) {
              // Try next encoding
              continue
            }
          }
          
          if (!success) {
            // Last resort: use UTF-8 with error replacement
            const decoder = new TextDecoder('utf-8', { fatal: false })
            text = decoder.decode(buffer)
          }
          
          // Apply character encoding fixes
          text = this.fixEncodingIssues(text)
          
          resolve(text)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Fix common encoding issues in the text
   */
  private static fixEncodingIssues(text: string): string {
    // Common encoding fixes for Turkish and European characters
    const fixes: Record<string, string> = {
      // Turkish character fixes
      'Ä°': 'İ',
      'Ã§': 'ç',
      'Ã¶': 'ö',
      'Ã¼': 'ü',
      'Ä±': 'ı',
      'Åž': 'ş',
      'Ä°sveÃ§': 'İsveç',
      'NorveÃ§': 'Norveç',
      'DanimarkaÃ§': 'Danimarkac',
      'AlmanyaÃ§': 'Almanyac',
      'FransaÃ§': 'Fransac',
      'HollandaÃ§': 'Hollandac',
      'Ä°ngilterÃ§': 'İngilterç',
      
      // European character fixes
      'Ã¤': 'ä',
      'Ã¥': 'å',
      'Ã¦': 'æ',
      'Ã¸': 'ø',
      'Ã©': 'é',
      'Ã¡': 'á',
      'Ã­': 'í',
      'Ã³': 'ó',
      'Ãº': 'ú',
      'Ã±': 'ñ',
      
      // Common word fixes
      'Ã§alÄ±ÅŸma': 'çalışma',
      'Ã¶Ä±renci': 'öğrenci',
      'Ã¼niversite': 'üniversite',
      'baÅŸvuru': 'başvuru'
    }

    let fixed = text
    for (const [wrong, correct] of Object.entries(fixes)) {
      fixed = fixed.replace(new RegExp(wrong, 'g'), correct)
    }

    return fixed
  }
}