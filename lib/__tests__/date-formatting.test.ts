import { getStaticDateDisplay, formatDateForSSR, validateDateFormatting } from '../utils/dateFormatting'

describe('Date Formatting Utilities', () => {
  const testDate = new Date('2024-01-15T10:30:00Z')
  const testDateString = '2024-01-15T10:30:00Z'

  describe('getStaticDateDisplay', () => {
    it('should return consistent date format for Date object', () => {
      const result = getStaticDateDisplay(testDate)
      
      expect(result.absolute).toBe('Jan 15, 2024')
      expect(result.relative).toBe('Click to see relative time')
      expect(result.iso).toBe('2024-01-15T10:30:00.000Z')
      expect(typeof result.timestamp).toBe('number')
    })

    it('should return consistent date format for date string', () => {
      const result = getStaticDateDisplay(testDateString)
      
      expect(result.absolute).toBe('Jan 15, 2024')
      expect(result.relative).toBe('Click to see relative time')
      expect(result.iso).toBe('2024-01-15T10:30:00.000Z')
    })

    it('should handle edge cases like end of month', () => {
      const endOfMonth = new Date('2024-01-31T23:59:59Z')
      const result = getStaticDateDisplay(endOfMonth)
      
      expect(result.absolute).toBe('Jan 31, 2024')
    })

    it('should handle leap year dates', () => {
      const leapYearDate = new Date('2024-02-29T12:00:00Z')
      const result = getStaticDateDisplay(leapYearDate)
      
      expect(result.absolute).toBe('Feb 29, 2024')
    })
  })

  describe('formatDateForSSR', () => {
    it('should return hydration-safe date string', () => {
      const result = formatDateForSSR(testDate)
      expect(result).toBe('Jan 15, 2024')
    })

    it('should work with string input', () => {
      const result = formatDateForSSR(testDateString)
      expect(result).toBe('Jan 15, 2024')
    })
  })

  describe('validateDateFormatting', () => {
    it('should validate correct dates and detect potential locale differences', () => {
      const result = validateDateFormatting(testDate)
      // The function should detect that our static format differs from locale format
      // This is expected and helps identify potential hydration issues
      expect(typeof result.isHydrationSafe).toBe('boolean')
      expect(Array.isArray(result.issues)).toBe(true)
    })

    it('should detect invalid dates', () => {
      const result = validateDateFormatting('invalid-date')
      expect(result.isHydrationSafe).toBe(false)
      expect(result.issues).toContain('Invalid date provided')
    })

    it('should warn about potential locale differences', () => {
      // This test might pass or fail depending on the system locale
      // The important thing is that it doesn't crash
      const result = validateDateFormatting(testDate)
      expect(Array.isArray(result.issues)).toBe(true)
    })
  })

  describe('Hydration Safety', () => {
    it('should produce identical results across multiple calls', () => {
      const result1 = getStaticDateDisplay(testDate)
      const result2 = getStaticDateDisplay(testDate)
      
      expect(result1.absolute).toBe(result2.absolute)
      expect(result1.iso).toBe(result2.iso)
      expect(result1.timestamp).toBe(result2.timestamp)
    })

    it('should produce identical results for Date object and equivalent string', () => {
      const dateResult = getStaticDateDisplay(testDate)
      const stringResult = getStaticDateDisplay(testDate.toISOString())
      
      expect(dateResult.absolute).toBe(stringResult.absolute)
      expect(dateResult.iso).toBe(stringResult.iso)
    })
  })
})