"use client"

import { useState } from "react"
import { X, Download, Trash2, AlertTriangle, Shield } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import toast from "react-hot-toast"

interface DataManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DataManagementModal({ isOpen, onClose }: DataManagementModalProps) {
  const { user } = useAuthStore()
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState("")

  const handleExportData = async () => {
    if (!user) return

    setIsExporting(true)
    try {
      const response = await fetch("/api/user/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success("Data exported successfully!")
      } else {
        toast.error("Failed to export data")
      }
    } catch (error) {
      toast.error("An error occurred while exporting data")
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteData = async () => {
    if (!user || confirmDelete !== "DELETE") return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      const result = await response.json()

      if (result.success) {
        toast.success("All data deleted successfully")
        onClose()
        // Redirect to home or logout
        window.location.href = "/"
      } else {
        toast.error(result.error?.message || "Failed to delete data")
      }
    } catch (error) {
      toast.error("An error occurred while deleting data")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Data Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Download className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Export Your Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download a complete copy of all your data including applications, preferences, and profile information in JSON format.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">What's included:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• All job applications and their details</li>
                    <li>• User profile and preferences</li>
                    <li>• AI insights and analytics data</li>
                    <li>• Contact information and notes</li>
                  </ul>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? "Exporting..." : "Export Data"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Delete Data Section */}
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-red-900 mb-2">Delete All Data</h3>
                <p className="text-sm text-red-700 mb-4">
                  Permanently delete all your data from our servers. This action cannot be undone.
                </p>
                
                <div className="bg-red-100 border border-red-300 rounded-md p-3 mb-4">
                  <h4 className="text-sm font-medium text-red-900 mb-2">This will permanently delete:</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Your user account and profile</li>
                    <li>• All job applications and data</li>
                    <li>• AI insights and analytics</li>
                    <li>• All preferences and settings</li>
                    <li>• Contact information and notes</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-red-900 mb-1">
                      Type "DELETE" to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  
                  <button
                    onClick={handleDeleteData}
                    disabled={isDeleting || confirmDelete !== "DELETE"}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isDeleting ? "Deleting..." : "Delete All Data"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Privacy Information</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                • Your data is stored securely and encrypted at rest
              </p>
              <p>
                • We never share your personal data with third parties without consent
              </p>
              <p>
                • You can request data portability or deletion at any time
              </p>
              <p>
                • For questions about data handling, contact our privacy team
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}