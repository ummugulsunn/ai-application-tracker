export interface Application {
  id: string
  company: string
  position: string
  location: string
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Freelance'
  salary: string
  status: 'Pending' | 'Applied' | 'Interviewing' | 'Offered' | 'Rejected' | 'Accepted' | 'Withdrawn'
  appliedDate: string
  responseDate: string | null
  interviewDate: string | null
  notes: string
  contactPerson: string
  contactEmail: string
  website: string
  tags: string[]
  priority: 'Low' | 'Medium' | 'High'
  createdAt: string
  updatedAt: string
}

export interface ApplicationStats {
  total: number
  pending: number
  applied: number
  interviewing: number
  offered: number
  rejected: number
  accepted: number
  successRate: number
  averageResponseTime: number
  topCompanies: string[]
  topLocations: string[]
}

export interface FilterOptions {
  status: string[]
  type: string[]
  location: string[]
  priority: string[]
  tags: string[]
  dateRange: {
    start: string | null
    end: string | null
  }
}

export interface SortOptions {
  field: keyof Application
  direction: 'asc' | 'desc'
}
