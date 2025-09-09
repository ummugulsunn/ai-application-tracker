export interface Contact {
  id: string
  userId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company?: string
  position?: string
  linkedinUrl?: string
  relationshipType?: 'colleague' | 'recruiter' | 'manager' | 'friend' | 'mentor' | 'other'
  connectionStrength?: 'strong' | 'medium' | 'weak'
  lastContactDate?: Date
  notes?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateContactRequest {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company?: string
  position?: string
  linkedinUrl?: string
  relationshipType?: Contact['relationshipType']
  connectionStrength?: Contact['connectionStrength']
  lastContactDate?: Date
  notes?: string
  tags?: string[]
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {
  id: string
}

export interface ContactFilters {
  search?: string
  company?: string
  relationshipType?: Contact['relationshipType']
  connectionStrength?: Contact['connectionStrength']
  tags?: string[]
  sortBy?: 'name' | 'company' | 'lastContact' | 'created'
  sortOrder?: 'asc' | 'desc'
}

export interface ContactStats {
  totalContacts: number
  byRelationshipType: Record<string, number>
  byConnectionStrength: Record<string, number>
  byCompany: Record<string, number>
  recentContacts: number
  overdueFollowUps: number
}

export interface ContactInteraction {
  id: string
  contactId: string
  type: 'email' | 'call' | 'meeting' | 'linkedin' | 'other'
  subject?: string
  notes?: string
  date: Date
  followUpDate?: Date
}