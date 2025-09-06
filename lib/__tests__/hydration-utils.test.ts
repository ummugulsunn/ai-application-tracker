/**
 * Tests for hydration-safe utility functions
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import {
  useProgressiveEnhancement,
  useBrowserAPI,
  createStableKey,
  validateHydrationSafety,
  useHydrationSafeAnimation,
  safeGet,
  createHydrationSafeId,
  validateListKeys,
  logHydrationMismatch,
  useHydrationMismatchDetector
} from '../utils/hydrationUtils'

// Mock console.warn for testing
const mockConsoleWarn = jest.fn()
const originalConsoleWarn = console.warn
const originalNodeEnv = process.env.NODE_ENV

beforeEach(() => {
  console.warn = mockConsoleWarn
  mockConsoleWarn.mockClear()
})

afterEach(() => {
  console.warn = originalConsoleWarn
  process.env.NODE_ENV = originalNodeEnv
})

describe('useProgressiveEnhancement', () => {
  it('should eventually set client and hydrated to true', async () => {
    const { result } = renderHook(() => useProgressiveEnhancement())
    
    // Wait for the useEffect to run
    await waitFor(() => {
      expect(result.current.isClient).toBe(true)
      expect(result.current.isHydrated).toBe(true)
    })
  })

  it('should enable features when hydrated', async () => {
    const mockFeature = jest.fn()
    const { result } = renderHook(() => useProgressiveEnhancement())
    
    // Wait for hydration
    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true)
    })
    
    act(() => {
      result.current.enableFeature(mockFeature)
    })
    expect(mockFeature).toHaveBeenCalled()
  })
})

describe('useBrowserAPI', () => {
  it('should eventually set isBrowser to true and provide browser APIs', async () => {
    const { result } = renderHook(() => useBrowserAPI())
    
    await waitFor(() => {
      expect(result.current.isBrowser).toBe(true)
      expect(result.current.window).toBeDefined()
      expect(result.current.document).toBeDefined()
    })
  })
})

describe('createStableKey', () => {
  it('should create consistent keys with prefix and identifier', () => {
    const key1 = createStableKey('item', 123)
    const key2 = createStableKey('item', 123)
    
    expect(key1).toBe('item-123')
    expect(key1).toBe(key2)
  })

  it('should include suffix when provided', () => {
    const key = createStableKey('item', 123, 'suffix')
    
    expect(key).toBe('item-123-suffix')
  })

  it('should handle string identifiers', () => {
    const key = createStableKey('user', 'john-doe')
    
    expect(key).toBe('user-john-doe')
  })
})

describe('validateHydrationSafety', () => {
  it('should pass validation for safe props', () => {
    const props = {
      title: 'Test',
      count: 42,
      isActive: true,
      items: ['a', 'b', 'c']
    }
    
    const result = validateHydrationSafety(props)
    
    expect(result.isHydrationSafe).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  it('should detect Date objects', () => {
    const props = {
      createdAt: new Date(),
      title: 'Test'
    }
    
    const result = validateHydrationSafety(props)
    
    expect(result.isHydrationSafe).toBe(false)
    expect(result.issues).toContain(
      "Prop 'createdAt' contains a Date object. Use static date formatting for SSR compatibility."
    )
  })

  it('should detect function props', () => {
    const props = {
      onClick: () => {},
      title: 'Test'
    }
    
    const result = validateHydrationSafety(props)
    
    expect(result.isHydrationSafe).toBe(false)
    expect(result.issues).toContain(
      "Prop 'onClick' contains a function. Ensure it's not used in rendering logic that affects HTML structure."
    )
  })
})

describe('useHydrationSafeAnimation', () => {
  it('should start with animation disabled by default', () => {
    const { result } = renderHook(() => useHydrationSafeAnimation())
    
    expect(result.current.isAnimationEnabled).toBe(false)
  })

  it('should respect initial state', () => {
    const { result } = renderHook(() => useHydrationSafeAnimation(true))
    
    expect(result.current.isAnimationEnabled).toBe(true)
  })

  it('should enable animations after hydration', async () => {
    const { result } = renderHook(() => useHydrationSafeAnimation())
    
    // Wait for hydration and animation delay
    await waitFor(() => {
      expect(result.current.isAnimationEnabled).toBe(true)
    }, { timeout: 1000 })
  })

  it('should allow manual control of animations', () => {
    const { result } = renderHook(() => useHydrationSafeAnimation())
    
    act(() => {
      result.current.enableAnimations()
    })
    expect(result.current.isAnimationEnabled).toBe(true)
    
    act(() => {
      result.current.disableAnimations()
    })
    expect(result.current.isAnimationEnabled).toBe(false)
  })
})

describe('safeGet', () => {
  const testObj = {
    user: {
      profile: {
        name: 'John',
        age: 30
      }
    },
    items: [1, 2, 3]
  }

  it('should get nested values safely', () => {
    expect(safeGet(testObj, 'user.profile.name', 'default')).toBe('John')
    expect(safeGet(testObj, 'user.profile.age', 0)).toBe(30)
  })

  it('should return default value for missing paths', () => {
    expect(safeGet(testObj, 'user.profile.email', 'no-email')).toBe('no-email')
    expect(safeGet(testObj, 'missing.path', 'default')).toBe('default')
  })

  it('should handle null/undefined objects', () => {
    expect(safeGet(null, 'any.path', 'default')).toBe('default')
    expect(safeGet(undefined, 'any.path', 'default')).toBe('default')
  })

  it('should handle array access', () => {
    expect(safeGet(testObj, 'items.0', 'default')).toBe(1)
    expect(safeGet(testObj, 'items.10', 'default')).toBe('default')
  })
})

describe('createHydrationSafeId', () => {
  it('should create unique IDs', () => {
    const id1 = createHydrationSafeId()
    const id2 = createHydrationSafeId()
    
    expect(id1).not.toBe(id2)
  })

  it('should use provided prefix', () => {
    const id = createHydrationSafeId('test')
    
    expect(id).toMatch(/^test-/)
  })

  it('should use default prefix when none provided', () => {
    const id = createHydrationSafeId()
    
    expect(id).toMatch(/^id-/)
  })
})

describe('validateListKeys', () => {
  it('should validate items with unique IDs', () => {
    const items = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
      { id: '3', name: 'Item 3' }
    ]
    
    const result = validateListKeys(items)
    
    expect(result.isValid).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  it('should detect duplicate keys', () => {
    const items = [
      { id: '1', name: 'Item 1' },
      { id: '1', name: 'Item 2' },
      { id: '3', name: 'Item 3' }
    ]
    
    const result = validateListKeys(items)
    
    expect(result.isValid).toBe(false)
    expect(result.issues).toContain('Duplicate key found: 1')
  })

  it('should warn about using array indices as keys', () => {
    const items = [
      { name: 'Item 1' },
      { name: 'Item 2' }
    ]
    
    const result = validateListKeys(items)
    
    expect(result.isValid).toBe(false)
    expect(result.issues).toContain(
      'Using array index as key can cause hydration issues if list order changes'
    )
  })

  it('should work with custom key extractor', () => {
    const items = [
      { uuid: 'a1', name: 'Item 1' },
      { uuid: 'b2', name: 'Item 2' }
    ]
    
    const result = validateListKeys(items, (item) => item.uuid)
    
    expect(result.isValid).toBe(true)
    expect(result.issues).toHaveLength(0)
  })
})

describe('logHydrationMismatch', () => {
  it('should log warnings in development mode', () => {
    process.env.NODE_ENV = 'development'
    
    logHydrationMismatch('TestComponent', 'server', 'client')
    
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Hydration mismatch detected in TestComponent:',
      '\nServer value:', 'server',
      '\nClient value:', 'client'
    )
  })

  it('should not log warnings in production mode', () => {
    process.env.NODE_ENV = 'production'
    
    logHydrationMismatch('TestComponent', 'server', 'client')
    
    expect(mockConsoleWarn).not.toHaveBeenCalled()
  })
})

describe('useHydrationMismatchDetector', () => {
  it('should detect mismatches in development mode', async () => {
    process.env.NODE_ENV = 'development'
    
    const initialValues = { count: 1, name: 'test' }
    const newValues = { count: 2, name: 'test' }
    
    const { result, rerender } = renderHook(
      ({ values }) => useHydrationMismatchDetector('TestComponent', values),
      { initialProps: { values: initialValues } }
    )
    
    // Rerender with different values to simulate hydration mismatch
    rerender({ values: newValues })
    
    await waitFor(() => {
      expect(result.current.hasMounted).toBe(true)
    })
    
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Hydration mismatch detected in TestComponent.count:',
      '\nServer value:', 1,
      '\nClient value:', 2
    )
  })

  it('should not detect mismatches when values are the same', async () => {
    process.env.NODE_ENV = 'development'
    
    const values = { count: 1, name: 'test' }
    
    const { result } = renderHook(() =>
      useHydrationMismatchDetector('TestComponent', values)
    )
    
    await waitFor(() => {
      expect(result.current.hasMounted).toBe(true)
    })
    
    expect(mockConsoleWarn).not.toHaveBeenCalled()
  })
})