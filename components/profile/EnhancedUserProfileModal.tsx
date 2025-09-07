'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  UserIcon, 
  BellIcon, 
  ShieldCheckIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  CheckIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { UserPreferences } from '@/types/auth'
import { toast } from 'react-hot-toast'

interface EnhancedUserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'appearance' | 'language' | 'notifications' | 'dashboard' | 'privacy'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
]

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
]

const timezones = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Istanbul',
  'Asia/Tokyo',
  'Australia/Sydney',
]

export default function EnhancedUserProfileModal({ isOpen, onClose }: EnhancedUserProfileModalProps) {
  const { preferences, savePreferences, isLoading } = useUserPreferences()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<TabType>('appearance')
  const [localPreferences, setLocalPreferences] = useState<Partial<UserPreferences>>({})

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences)
    }
  }, [preferences])

  const handleSave = async () => {
    const success = await savePreferences(localPreferences)
    if (success) {
      toast.success(t('message.success'))
    } else {
      toast.error(t('message.error'))
    }
  }

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const tabs = [
    { 
      id: 'appearance' as const, 
      label: t('settings.appearance'), 
      icon: PaintBrushIcon,
      description: 'Theme, colors, and visual preferences'
    },
    { 
      id: 'language' as const, 
      label: t('settings.language'), 
      icon: GlobeAltIcon,
      description: 'Language, region, and format settings'
    },
    { 
      id: 'notifications' as const, 
      label: t('settings.notifications'), 
      icon: BellIcon,
      description: 'Email alerts and reminder preferences'
    },
    { 
      id: 'dashboard' as const, 
      label: 'Dashboard', 
      icon: Cog6ToothIcon,
      description: 'Layout and display customization'
    },
    { 
      id: 'privacy' as const, 
      label: t('settings.privacy'), 
      icon: ShieldCheckIcon,
      description: 'Data retention and privacy controls'
    },
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  User Preferences
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Customize your experience
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="flex h-[calc(90vh-140px)]">
              {/* Sidebar */}
              <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <nav className="p-4 space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-start space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{tab.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {tab.description}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'appearance' && (
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        {t('settings.appearance')}
                      </h3>
                      
                      {/* Theme Selection */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            {t('settings.theme')}
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: 'light', label: t('theme.light'), icon: SunIcon },
                              { value: 'dark', label: t('theme.dark'), icon: MoonIcon },
                              { value: 'system', label: t('theme.system'), icon: ComputerDesktopIcon },
                            ].map((themeOption) => {
                              const Icon = themeOption.icon
                              return (
                                <button
                                  key={themeOption.value}
                                  onClick={() => {
                                    setTheme(themeOption.value as any)
                                    updatePreference('theme', themeOption.value as any)
                                  }}
                                  className={`relative p-4 rounded-lg border-2 transition-all ${
                                    theme === themeOption.value
                                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                  }`}
                                >
                                  <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {themeOption.label}
                                  </div>
                                  {theme === themeOption.value && (
                                    <CheckIcon className="absolute top-2 right-2 w-4 h-4 text-primary-500" />
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Dashboard Layout */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Dashboard Layout
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: 'compact', label: 'Compact', description: 'Dense layout' },
                              { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing' },
                              { value: 'spacious', label: 'Spacious', description: 'Lots of whitespace' },
                            ].map((layout) => (
                              <button
                                key={layout.value}
                                onClick={() => updatePreference('dashboardLayout', layout.value as any)}
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                  localPreferences.dashboardLayout === layout.value
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                              >
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {layout.label}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {layout.description}
                                </div>
                                {localPreferences.dashboardLayout === layout.value && (
                                  <CheckIcon className="w-4 h-4 text-primary-500 mt-2" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'language' && (
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        {t('settings.language')} & Region
                      </h3>
                      
                      {/* Language Selection */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Display Language
                          </label>
                          <div className="space-y-2">
                            {languages.map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => {
                                  setLanguage(lang.code as any)
                                  updatePreference('language', lang.code)
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                  language === lang.code
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-xl">{lang.flag}</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {lang.name}
                                  </span>
                                </div>
                                {language === lang.code && (
                                  <CheckIcon className="w-5 h-5 text-primary-500" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Date Format */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Date Format
                          </label>
                          <select
                            value={localPreferences.dateFormat || 'MM/DD/YYYY'}
                            onChange={(e) => updatePreference('dateFormat', e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                          </select>
                        </div>

                        {/* Currency */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Currency
                          </label>
                          <select
                            value={localPreferences.currency || 'USD'}
                            onChange={(e) => updatePreference('currency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            {currencies.map((currency) => (
                              <option key={currency.code} value={currency.code}>
                                {currency.symbol} {currency.name} ({currency.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Timezone */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Timezone
                          </label>
                          <select
                            value={localPreferences.timezone || 'UTC'}
                            onChange={(e) => updatePreference('timezone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            {timezones.map((tz) => (
                              <option key={tz} value={tz}>
                                {tz}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        {t('settings.notifications')}
                      </h3>
                      
                      <div className="space-y-4">
                        {[
                          { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                          { key: 'aiRecommendations', label: 'AI Recommendations', description: 'Get AI-powered job recommendations' },
                          { key: 'followUpReminders', label: 'Follow-up Reminders', description: 'Reminders to follow up on applications' },
                          { key: 'interviewReminders', label: 'Interview Reminders', description: 'Reminders for upcoming interviews' },
                          { key: 'applicationDeadlines', label: 'Application Deadlines', description: 'Alerts for application deadlines' },
                        ].map((notification) => (
                          <div key={notification.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {notification.label}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {notification.description}
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={localPreferences[notification.key as keyof UserPreferences] as boolean || false}
                                onChange={(e) => updatePreference(notification.key as keyof UserPreferences, e.target.checked as any)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        ))}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Reminder Frequency
                          </label>
                          <select
                            value={localPreferences.reminderFrequency || 'Daily'}
                            onChange={(e) => updatePreference('reminderFrequency', e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Never">Never</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'dashboard' && (
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Dashboard Settings
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Default View
                          </label>
                          <select
                            value={localPreferences.defaultView || 'table'}
                            onChange={(e) => updatePreference('defaultView', e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="table">Table View</option>
                            <option value="cards">Card View</option>
                            <option value="kanban">Kanban Board</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Items Per Page
                          </label>
                          <select
                            value={localPreferences.itemsPerPage || 25}
                            onChange={(e) => updatePreference('itemsPerPage', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Show Completed Applications
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Display applications with final status
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={localPreferences.showCompletedApplications || false}
                              onChange={(e) => updatePreference('showCompletedApplications', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        {t('settings.privacy')} & Data
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Data Retention
                          </label>
                          <select
                            value={localPreferences.dataRetention || '2years'}
                            onChange={(e) => updatePreference('dataRetention', e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="1year">1 Year</option>
                            <option value="2years">2 Years</option>
                            <option value="5years">5 Years</option>
                            <option value="indefinite">Indefinite</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Share Analytics
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Help improve the service with anonymous usage data
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={localPreferences.shareAnalytics || false}
                              onChange={(e) => updatePreference('shareAnalytics', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Allow Data Export
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Enable data export functionality
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={localPreferences.allowDataExport !== false}
                              onChange={(e) => updatePreference('allowDataExport', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Changes are saved automatically
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  {t('form.cancel')}
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>{t('form.save')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}