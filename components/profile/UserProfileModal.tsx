"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, User, Bell, Layout, Shield, Palette, Globe, Database } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { UserProfile, UserPreferences } from "@/types/auth"
import { DataManagementModal } from "./DataManagementModal"
import toast from "react-hot-toast"

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  location: z.string().optional(),
  experienceLevel: z.enum(["Entry", "Mid", "Senior", "Executive"]).optional(),
  desiredSalaryMin: z.number().optional(),
  desiredSalaryMax: z.number().optional(),
  preferredLocations: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  jobTypes: z.array(z.string()).default([]),
  resumeUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
})

const preferencesSchema = z.object({
  // Notification preferences
  emailNotifications: z.boolean().default(true),
  reminderFrequency: z.enum(["Daily", "Weekly", "Never"]).default("Daily"),
  aiRecommendations: z.boolean().default(true),
  followUpReminders: z.boolean().default(true),
  interviewReminders: z.boolean().default(true),
  applicationDeadlines: z.boolean().default(true),
  
  // Dashboard customization
  dashboardLayout: z.enum(["compact", "comfortable", "spacious"]).default("comfortable"),
  defaultView: z.enum(["table", "cards", "kanban"]).default("table"),
  itemsPerPage: z.number().min(5).max(100).default(25),
  showCompletedApplications: z.boolean().default(true),
  defaultSortBy: z.enum(["appliedDate", "company", "position", "status", "priority"]).default("appliedDate"),
  defaultSortOrder: z.enum(["asc", "desc"]).default("desc"),
  
  // Privacy controls
  dataRetention: z.enum(["1year", "2years", "5years", "indefinite"]).default("2years"),
  shareAnalytics: z.boolean().default(false),
  allowDataExport: z.boolean().default(true),
  
  // UI preferences
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.string().default("en"),
  timezone: z.string().default("UTC"),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).default("MM/DD/YYYY"),
  currency: z.string().default("USD"),
})

type ProfileFormData = z.infer<typeof profileSchema>
type PreferencesFormData = z.infer<typeof preferencesSchema>

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = "profile" | "notifications" | "dashboard" | "privacy" | "appearance"

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, profile, setProfile } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [skillInput, setSkillInput] = useState("")
  const [locationInput, setLocationInput] = useState("")
  const [industryInput, setIndustryInput] = useState("")
  const [showDataManagement, setShowDataManagement] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      location: "",
      preferredLocations: [],
      skills: [],
      industries: [],
      jobTypes: [],
      resumeUrl: "",
      linkedinUrl: "",
      githubUrl: "",
      portfolioUrl: "",
    }
  })

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: preferencesSchema.parse({})
  })

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      profileForm.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone || "",
        location: profile.location || "",
        experienceLevel: profile.experienceLevel,
        desiredSalaryMin: profile.desiredSalaryMin,
        desiredSalaryMax: profile.desiredSalaryMax,
        preferredLocations: profile.preferredLocations || [],
        skills: profile.skills || [],
        industries: profile.industries || [],
        jobTypes: profile.jobTypes || [],
        resumeUrl: profile.resumeUrl || "",
        linkedinUrl: profile.linkedinUrl || "",
        githubUrl: profile.githubUrl || "",
        portfolioUrl: profile.portfolioUrl || "",
      })

      if (profile.preferences) {
        preferencesForm.reset(profile.preferences)
      }
    }
  }, [isOpen, profile, profileForm, preferencesForm])

  const handleProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setProfile(result.data)
        toast.success("Profile updated successfully!")
      } else {
        toast.error(result.error?.message || "Failed to update profile")
      }
    } catch (error) {
      toast.error("An error occurred while updating profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferencesSubmit = async (data: PreferencesFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setProfile(result.data)
        toast.success("Preferences updated successfully!")
      } else {
        toast.error(result.error?.message || "Failed to update preferences")
      }
    } catch (error) {
      toast.error("An error occurred while updating preferences")
    } finally {
      setIsLoading(false)
    }
  }

  const addSkill = () => {
    if (skillInput.trim()) {
      const currentSkills = profileForm.getValues("skills")
      if (!currentSkills.includes(skillInput.trim())) {
        profileForm.setValue("skills", [...currentSkills, skillInput.trim()])
        setSkillInput("")
      }
    }
  }

  const removeSkill = (skill: string) => {
    const currentSkills = profileForm.getValues("skills")
    profileForm.setValue("skills", currentSkills.filter(s => s !== skill))
  }

  const addLocation = () => {
    if (locationInput.trim()) {
      const currentLocations = profileForm.getValues("preferredLocations")
      if (!currentLocations.includes(locationInput.trim())) {
        profileForm.setValue("preferredLocations", [...currentLocations, locationInput.trim()])
        setLocationInput("")
      }
    }
  }

  const removeLocation = (location: string) => {
    const currentLocations = profileForm.getValues("preferredLocations")
    profileForm.setValue("preferredLocations", currentLocations.filter(l => l !== location))
  }

  const addIndustry = () => {
    if (industryInput.trim()) {
      const currentIndustries = profileForm.getValues("industries")
      if (!currentIndustries.includes(industryInput.trim())) {
        profileForm.setValue("industries", [...currentIndustries, industryInput.trim()])
        setIndustryInput("")
      }
    }
  }

  const removeIndustry = (industry: string) => {
    const currentIndustries = profileForm.getValues("industries")
    profileForm.setValue("industries", currentIndustries.filter(i => i !== industry))
  }

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "dashboard" as const, label: "Dashboard", icon: Layout },
    { id: "privacy" as const, label: "Privacy", icon: Shield },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">User Profile & Preferences</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r overflow-y-auto">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "profile" && (
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        {...profileForm.register("firstName")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {profileForm.formState.errors.firstName && (
                        <p className="text-red-600 text-sm mt-1">
                          {profileForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        {...profileForm.register("lastName")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {profileForm.formState.errors.lastName && (
                        <p className="text-red-600 text-sm mt-1">
                          {profileForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        {...profileForm.register("phone")}
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Location
                      </label>
                      <input
                        {...profileForm.register("location")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Experience Level
                      </label>
                      <select
                        {...profileForm.register("experienceLevel")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select level</option>
                        <option value="Entry">Entry Level</option>
                        <option value="Mid">Mid Level</option>
                        <option value="Senior">Senior Level</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Desired Salary Min ($)
                      </label>
                      <input
                        {...profileForm.register("desiredSalaryMin", { valueAsNumber: true })}
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Desired Salary Max ($)
                      </label>
                      <input
                        {...profileForm.register("desiredSalaryMax", { valueAsNumber: true })}
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Skills</h4>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      placeholder="Add a skill"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileForm.watch("skills").map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preferred Locations Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Preferred Locations</h4>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
                      placeholder="Add a preferred location"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addLocation}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileForm.watch("preferredLocations").map((location) => (
                      <span
                        key={location}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        {location}
                        <button
                          type="button"
                          onClick={() => removeLocation(location)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Industries Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Industries of Interest</h4>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={industryInput}
                      onChange={(e) => setIndustryInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIndustry())}
                      placeholder="Add an industry"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addIndustry}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileForm.watch("industries").map((industry) => (
                      <span
                        key={industry}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {industry}
                        <button
                          type="button"
                          onClick={() => removeIndustry(industry)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Links Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Professional Links</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resume URL
                      </label>
                      <input
                        {...profileForm.register("resumeUrl")}
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn URL
                      </label>
                      <input
                        {...profileForm.register("linkedinUrl")}
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GitHub URL
                      </label>
                      <input
                        {...profileForm.register("githubUrl")}
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Portfolio URL
                      </label>
                      <input
                        {...profileForm.register("portfolioUrl")}
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "notifications" && (
              <form onSubmit={preferencesForm.handleSubmit(handlePreferencesSubmit)} className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <input
                        {...preferencesForm.register("emailNotifications")}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">AI Recommendations</label>
                        <p className="text-sm text-gray-500">Get AI-powered job recommendations</p>
                      </div>
                      <input
                        {...preferencesForm.register("aiRecommendations")}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Follow-up Reminders</label>
                        <p className="text-sm text-gray-500">Reminders to follow up on applications</p>
                      </div>
                      <input
                        {...preferencesForm.register("followUpReminders")}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Interview Reminders</label>
                        <p className="text-sm text-gray-500">Reminders for upcoming interviews</p>
                      </div>
                      <input
                        {...preferencesForm.register("interviewReminders")}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Application Deadlines</label>
                        <p className="text-sm text-gray-500">Alerts for application deadlines</p>
                      </div>
                      <input
                        {...preferencesForm.register("applicationDeadlines")}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reminder Frequency
                      </label>
                      <select
                        {...preferencesForm.register("reminderFrequency")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Never">Never</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : "Save Notifications"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "dashboard" && (
              <form onSubmit={preferencesForm.handleSubmit(handlePreferencesSubmit)} className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dashboard Customization</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dashboard Layout
                      </label>
                      <select
                        {...preferencesForm.register("dashboardLayout")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="compact">Compact</option>
                        <option value="comfortable">Comfortable</option>
                        <option value="spacious">Spacious</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default View
                      </label>
                      <select
                        {...preferencesForm.register("defaultView")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="table">Table View</option>
                        <option value="cards">Card View</option>
                        <option value="kanban">Kanban Board</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Items Per Page
                      </label>
                      <select
                        {...preferencesForm.register("itemsPerPage", { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Sort By
                      </label>
                      <select
                        {...preferencesForm.register("defaultSortBy")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="appliedDate">Applied Date</option>
                        <option value="company">Company</option>
                        <option value="position">Position</option>
                        <option value="status">Status</option>
                        <option value="priority">Priority</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Sort Order
                      </label>
                      <select
                        {...preferencesForm.register("defaultSortOrder")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Show Completed Applications</label>
                        <p className="text-sm text-gray-500">Display applications with final status</p>
                      </div>
                      <input
                        {...preferencesForm.register("showCompletedApplications")}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : "Save Dashboard Settings"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "privacy" && (
              <form onSubmit={preferencesForm.handleSubmit(handlePreferencesSubmit)} className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy & Data Controls</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Retention Period
                      </label>
                      <select
                        {...preferencesForm.register("dataRetention")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1year">1 Year</option>
                        <option value="2years">2 Years</option>
                        <option value="5years">5 Years</option>
                        <option value="indefinite">Indefinite</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-1">
                        How long to keep your application data
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Share Anonymous Analytics</label>
                        <p className="text-sm text-gray-500">Help improve the app with anonymous usage data</p>
                      </div>
                      <input
                        {...preferencesForm.register("shareAnalytics")}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Allow Data Export</label>
                        <p className="text-sm text-gray-500">Enable data export functionality</p>
                      </div>
                      <input
                        {...preferencesForm.register("allowDataExport")}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Data Management Actions</h4>
                    <div className="space-y-2">
                      <button
                        type="button"
                        className="flex items-center space-x-2 w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                        onClick={() => setShowDataManagement(true)}
                      >
                        <Database className="w-4 h-4" />
                        <span>Manage My Data</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : "Save Privacy Settings"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "appearance" && (
              <form onSubmit={preferencesForm.handleSubmit(handlePreferencesSubmit)} className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance & Localization</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        {...preferencesForm.register("theme")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="system">System Default</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        {...preferencesForm.register("language")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Format
                      </label>
                      <select
                        {...preferencesForm.register("dateFormat")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        {...preferencesForm.register("currency")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD (C$)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        {...preferencesForm.register("timezone")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : "Save Appearance Settings"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Data Management Modal */}
      <DataManagementModal
        isOpen={showDataManagement}
        onClose={() => setShowDataManagement(false)}
      />
    </div>
  )
}