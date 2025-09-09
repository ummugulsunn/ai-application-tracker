import { Metadata } from 'next'
import { ContactsManager } from '@/components/contacts'

export const metadata: Metadata = {
  title: 'Contacts & Network | AI Application Tracker',
  description: 'Manage your professional network and track relationships with contacts in your job search.',
}

export default function ContactsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ContactsManager />
    </div>
  )
}