'use client'

import { useState } from 'react'
import { useContacts } from '@/lib/hooks/useContacts'
import { ContactsList } from './ContactsList'
import { ContactForm } from './ContactForm'
import { ContactStats } from './ContactStats'
import { ContactFilters } from './ContactFilters'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ApplicationTableSkeleton } from '@/components/ui/LoadingStates'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorNotification } from '@/components/ui/ErrorNotification'
import { Plus, Users, Search, Filter } from 'lucide-react'
import type { Contact, ContactFilters as ContactFiltersType } from '@/types/contact'

export function ContactsManager() {
  const {
    contacts,
    loading,
    error,
    stats,
    pagination,
    createContact,
    updateContact,
    deleteContact,
    setFilters,
    setPage
  } = useContacts()

  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleCreateContact = async (data: any) => {
    try {
      await createContact(data)
      setShowForm(false)
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleUpdateContact = async (data: any) => {
    try {
      await updateContact({ ...data, id: editingContact!.id })
      setEditingContact(null)
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleDeleteContact = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(id)
      } catch (error) {
        // Error is handled by the hook
      }
    }
  }

  const handleFiltersChange = (filters: ContactFiltersType) => {
    setFilters({ ...filters, search: searchQuery })
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setFilters({ search: query })
  }

  if (loading && contacts.length === 0) {
    return <ApplicationTableSkeleton rows={5} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6" />
            Contacts & Network
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your professional network and track relationships
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorNotification
          message={error}
          onDismiss={() => {}}
        />
      )}

      {/* Stats */}
      {stats && <ContactStats stats={stats} />}

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <ContactFilters onFiltersChange={handleFiltersChange} />
          </div>
        )}
      </Card>

      {/* Contacts List */}
      {contacts.length === 0 && !loading ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Start building your professional network by adding your first contact."
          action={
            <Button onClick={() => setShowForm(true)}>
              Add Your First Contact
            </Button>
          }
        />
      ) : (
        <ContactsList
          contacts={contacts}
          loading={loading}
          pagination={pagination}
          onEdit={setEditingContact}
          onDelete={handleDeleteContact}
          onPageChange={setPage}
        />
      )}

      {/* Contact Form Modal */}
      {(showForm || editingContact) && (
        <ContactForm
          contact={editingContact}
          onSubmit={editingContact ? handleUpdateContact : handleCreateContact}
          onCancel={() => {
            setShowForm(false)
            setEditingContact(null)
          }}
        />
      )}
    </div>
  )
}