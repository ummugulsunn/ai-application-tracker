'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut, useSession } from 'next-auth/react'
import { 
  PlusIcon, 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Button } from './ui/Button'
import { HelpTooltip } from './ui/HelpTooltip'
import { AccessibleMotion } from './ui/AccessibilityWrapper'
import { useAuthStore } from '@/store/authStore'
import { AuthModal } from './auth/AuthModal'
import { GuestModeIndicator } from './auth/GuestModeBanner'
import { ProfileButton } from './profile/ProfileButton'

interface HeaderProps {
  onAddNew: () => void
  onImport: () => void
  onExport?: () => void
  onShowHelp?: () => void
}

export default function Header({ onAddNew, onImport, onExport, onShowHelp }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const { data: session } = useSession()
  const { isAuthenticated, isGuest, user, logout } = useAuthStore()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setShowAuthModal(true)
    closeMenu()
  }

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
      logout()
      setShowUserMenu(false)
      closeMenu()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const displayUser = session?.user || user

  return (
    <header className="bg-white shadow-sm border-b border-gray-200" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <AccessibleMotion 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div 
              className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center"
              role="img"
              aria-label="AI Application Tracker logo"
            >
              <ChartBarIcon className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                AI Application Tracker
              </h1>
              <p className="text-sm text-gray-500">
                Smart job application management
              </p>
            </div>
          </AccessibleMotion>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Guest Mode Indicator */}
            {isGuest && (
              <GuestModeIndicator onRegisterClick={() => handleAuthClick('register')} />
            )}
            
            <nav className="flex items-center space-x-4" role="navigation" aria-label="Main navigation">
              <Button
                data-tour="add-button"
                onClick={onAddNew}
                leftIcon={<PlusIcon className="w-4 h-4" />}
                className="focus-visible-ring"
              >
                New Application
              </Button>
              
              <Button
                data-tour="import-button"
                onClick={onImport}
                variant="secondary"
                leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                className="focus-visible-ring"
              >
                Import CSV
              </Button>

              <Link href="/reminders">
                <Button
                  variant="outline"
                  leftIcon={<BellIcon className="w-4 h-4" />}
                  className="focus-visible-ring"
                >
                  Reminders
                </Button>
              </Link>

              <Link href="/job-recommendations">
                <Button
                  variant="outline"
                  leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.091z" />
                  </svg>}
                  className="focus-visible-ring"
                >
                  AI Jobs
                </Button>
              </Link>

              <Link href="/resume-tools">
                <Button
                  variant="outline"
                  leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>}
                  className="focus-visible-ring"
                >
                  Resume Tools
                </Button>
              </Link>

              <Link href="/integrations">
                <Button
                  variant="outline"
                  leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>}
                  className="focus-visible-ring"
                >
                  Integrations
                </Button>
              </Link>

              {onExport && (
                <Button
                  data-tour="export-button"
                  onClick={onExport}
                  variant="outline"
                  leftIcon={<ArrowUpTrayIcon className="w-4 h-4" />}
                  className="focus-visible-ring"
                >
                  Export
                </Button>
              )}

              {onShowHelp && (
                <Button
                  data-tour="help-button"
                  onClick={onShowHelp}
                  variant="ghost"
                  size="sm"
                  className="focus-visible-ring"
                  aria-label="Show help and tutorials"
                >
                  <QuestionMarkCircleIcon className="w-5 h-5" />
                </Button>
              )}
            </nav>

            {/* Authentication Section */}
            <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
              {isAuthenticated && displayUser ? (
                <div className="flex items-center space-x-3">
                  <ProfileButton />
                  <div className="relative">
                    <Button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      variant="ghost"
                      className="flex items-center space-x-2 focus-visible-ring"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {displayUser.firstName?.[0] || displayUser.name?.[0] || displayUser.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {displayUser.firstName || displayUser.name?.split(' ')[0] || 'User'}
                      </span>
                    </Button>

                    {/* User Dropdown Menu */}
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                        >
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">
                              {displayUser.firstName && displayUser.lastName 
                                ? `${displayUser.firstName} ${displayUser.lastName}`
                                : displayUser.name || 'User'
                              }
                            </p>
                            <p className="text-xs text-gray-500">{displayUser.email}</p>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleAuthClick('login')}
                    variant="ghost"
                    size="sm"
                    className="focus-visible-ring"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => handleAuthClick('register')}
                    size="sm"
                    className="focus-visible-ring"
                  >
                    Create Account
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              onClick={toggleMenu}
              variant="ghost"
              size="sm"
              className="focus-visible-ring"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="w-6 h-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              id="mobile-menu"
              className="md:hidden py-4 border-t border-gray-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              role="navigation"
              aria-label="Mobile navigation"
            >
              <div className="flex flex-col space-y-3">
                {/* Guest Mode Indicator for Mobile */}
                {isGuest && (
                  <div className="mb-3">
                    <GuestModeIndicator onRegisterClick={() => handleAuthClick('register')} />
                  </div>
                )}

                {/* User Info for Mobile */}
                {isAuthenticated && displayUser && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {displayUser.firstName?.[0] || displayUser.name?.[0] || displayUser.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {displayUser.firstName && displayUser.lastName 
                            ? `${displayUser.firstName} ${displayUser.lastName}`
                            : displayUser.name || 'User'
                          }
                        </p>
                        <p className="text-xs text-gray-500">{displayUser.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    onAddNew()
                    closeMenu()
                  }}
                  leftIcon={<PlusIcon className="w-4 h-4" />}
                  className="w-full justify-center focus-visible-ring"
                >
                  New Application
                </Button>
                
                <Button
                  onClick={() => {
                    onImport()
                    closeMenu()
                  }}
                  variant="secondary"
                  leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                  className="w-full justify-center focus-visible-ring"
                >
                  Import CSV
                </Button>

                {onExport && (
                  <Button
                    onClick={() => {
                      onExport()
                      closeMenu()
                    }}
                    variant="outline"
                    leftIcon={<ArrowUpTrayIcon className="w-4 h-4" />}
                    className="w-full justify-center focus-visible-ring"
                  >
                    Export Data
                  </Button>
                )}

                {onShowHelp && (
                  <Button
                    onClick={() => {
                      onShowHelp()
                      closeMenu()
                    }}
                    variant="outline"
                    leftIcon={<QuestionMarkCircleIcon className="w-4 h-4" />}
                    className="w-full justify-center focus-visible-ring"
                  >
                    Help & Tutorials
                  </Button>
                )}

                {/* Authentication Buttons for Mobile */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  {isAuthenticated ? (
                    <Button
                      onClick={() => {
                        handleLogout()
                        closeMenu()
                      }}
                      variant="outline"
                      leftIcon={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                      className="w-full justify-center focus-visible-ring"
                    >
                      Sign Out
                    </Button>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <Button
                        onClick={() => handleAuthClick('login')}
                        variant="outline"
                        leftIcon={<UserIcon className="w-4 h-4" />}
                        className="w-full justify-center focus-visible-ring"
                      >
                        Sign In
                      </Button>
                      <Button
                        onClick={() => handleAuthClick('register')}
                        className="w-full justify-center focus-visible-ring"
                      >
                        Create Account
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Authentication Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </div>
    </header>
  )
}
