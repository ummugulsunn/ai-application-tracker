'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'
import type { ContactFilters as ContactFiltersType } from '@/types/contact'

interface ContactFiltersProps {
  onFiltersChange: (filters: ContactFiltersType) => void
}

export function ContactFilters({ onFiltersChange }: ContactFiltersProps) {
  const [filters, setFilters] = useState<ContactFiltersType>({
    company: '',
    relationshipType: undefined,
    connectionStrength: undefined,
    tags: [],
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const handleFilterChange = (key: keyof ContactFiltersType, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const addTag = () => {
    if (newTag.trim() && !filters.tags?.includes(newTag.trim())) {
      setFilters(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  const clearFilters = () => {
    setFilters({
      company: '',
      relationshipType: undefined,
      connectionStrength: undefined,
      tags: [],
      sortBy: 'name',
      sortOrder: 'asc'
    })
    setNewTag('')
  }

  const hasActiveFilters = filters.company || 
    filters.relationshipType || 
    filters.connectionStrength || 
    (filters.tags && filters.tags.length > 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Company Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Company
          </label>
          <Input
            type="text"
            value={filters.company || ''}
            onChange={(e) => handleFilterChange('company', e.target.value)}
            placeholder="Filter by company"
          />
        </div>

        {/* Relationship Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Relationship Type
          </label>
          <select
            value={filters.relationshipType || ''}
            onChange={(e) => handleFilterChange('relationshipType', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All relationships</option>
            <option value="colleague">Colleague</option>
            <option value="recruiter">Recruiter</option>
            <option value="manager">Manager</option>
            <option value="friend">Friend</option>
            <option value="mentor">Mentor</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Connection Strength Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Connection Strength
          </label>
          <select
            value={filters.connectionStrength || ''}
            onChange={(e) => handleFilterChange('connectionStrength', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All strengths</option>
            <option value="strong">Strong</option>
            <option value="medium">Medium</option>
            <option value="weak">Weak</option>
          </select>
        </div>
      </div>

      {/* Tags Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {filters.tags?.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="Add tag filter"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            disabled={!newTag.trim()}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Sort Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <select
            value={filters.sortBy || 'name'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="name">Name</option>
            <option value="company">Company</option>
            <option value="lastContact">Last Contact</option>
            <option value="created">Date Added</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort Order
          </label>
          <select
            value={filters.sortOrder || 'asc'}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="text-sm"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}