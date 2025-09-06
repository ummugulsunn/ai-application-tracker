"use client"

import { useState } from "react"
import { User, Settings } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { UserProfileModal } from "./UserProfileModal"

export function ProfileButton() {
  const { user, profile, isAuthenticated } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!isAuthenticated || !user) {
    return null
  }

  const displayName = profile?.firstName 
    ? `${profile.firstName} ${profile.lastName}`
    : user.name || user.email

  const initials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`
    : user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2)
    : user.email?.[0] || 'U'

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            {initials?.toUpperCase() || 'U'}
          </div>
          <span className="hidden md:block">{displayName}</span>
          <Settings className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <UserProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}