'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'

interface SmartInputProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  type?: 'company' | 'position' | 'location' | 'text'
  label?: string
  error?: string
  suggestions?: string[]
  maxSuggestions?: number
  debounceMs?: number
}

export default function SmartInput({
  value,
  onChange,
  onSelect,
  placeholder,
  className = '',
  disabled = false,
  required = false,
  type = 'text',
  label,
  error,
  suggestions: externalSuggestions,
  maxSuggestions = 8,
  debounceMs = 300
}: SmartInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (query: string) => {
    if (type === 'text' || !query.trim()) {
      setSuggestions(externalSuggestions || [])
      return
    }

    setIsLoading(true)
    try {
      const endpoint = `/api/suggestions/${type}s?q=${encodeURIComponent(query)}&limit=${maxSuggestions}`
      const response = await fetch(endpoint)
      const data = await response.json()
      
      if (data.success) {
        setSuggestions(data.data || [])
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [type, maxSuggestions, externalSuggestions])

  // Debounced suggestion fetching
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (value.length > 0) {
        fetchSuggestions(value)
      } else {
        fetchSuggestions('')
      }
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value, fetchSuggestions, debounceMs])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setSelectedIndex(-1)
    setIsOpen(true)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion)
    onSelect?.(suggestion)
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true)
        setSelectedIndex(0)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          const selectedSuggestion = suggestions[selectedIndex]
          if (selectedSuggestion) {
            handleSuggestionSelect(selectedSuggestion)
          }
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          const selectedSuggestion = suggestions[selectedIndex]
          if (selectedSuggestion) {
            e.preventDefault()
            handleSuggestionSelect(selectedSuggestion)
          }
        } else {
          setIsOpen(false)
        }
        break
    }
  }

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true)
    }
  }

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    // Delay closing to allow for suggestion clicks (only on client)
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        if (!containerRef.current?.contains(document.activeElement)) {
          setIsOpen(false)
          setSelectedIndex(-1)
        }
      }, 150)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showSuggestions = isOpen && suggestions.length > 0
  const inputClassName = `
    w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
    ${className}
  `.trim()

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClassName}
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        
        {(type !== 'text' && suggestions.length > 0) && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            <ChevronDownIcon 
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </button>
        )}
        
        {isLoading && (
          <div className="absolute inset-y-0 right-8 flex items-center pr-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            role="listbox"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`
                  w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                  ${index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                  ${index === 0 ? 'rounded-t-md' : ''}
                  ${index === suggestions.length - 1 ? 'rounded-b-md' : ''}
                `}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{suggestion}</span>
                  {value.toLowerCase() === suggestion.toLowerCase() && (
                    <CheckIcon className="w-4 h-4 text-green-500 ml-2 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}