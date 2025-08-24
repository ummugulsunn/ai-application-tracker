'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon, 
  ArrowDownTrayIcon, 
  ChartBarIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline'

interface HeaderProps {
  onAddNew: () => void
  onImport: () => void
}

export default function Header({ onAddNew, onImport }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                AI Application Tracker
              </h1>
              <p className="text-sm text-gray-500">
                Smart job application management
              </p>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <button
              onClick={onAddNew}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Application</span>
            </button>
            
            <button
              onClick={onImport}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Import CSV</span>
            </button>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <motion.div 
            className="md:hidden py-4 border-t border-gray-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => {
                  onAddNew()
                  setIsMenuOpen(false)
                }}
                className="btn-primary w-full justify-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Application
              </button>
              
              <button
                onClick={() => {
                  onImport()
                  setIsMenuOpen(false)
                }}
                className="btn-secondary w-full justify-center"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Import CSV
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  )
}
