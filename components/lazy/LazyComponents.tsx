'use client'

import { createLazyComponent, LazyModalWrapper, LazyDashboardSection } from '@/lib/utils/lazyLoading'
import { DashboardSkeleton, ApplicationCardSkeleton } from '@/components/ui/LoadingStates'

// Modal loading fallback
const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  </div>
)

// Lazy load heavy modals
export const LazyImportModal = createLazyComponent(
  () => import('@/components/ImportModal'),
  <ModalLoadingFallback />
)

export const LazyExportModal = createLazyComponent(
  () => import('@/components/ExportModal').then(mod => ({ default: mod.ExportModal })),
  <ModalLoadingFallback />
)

export const LazyBulkDuplicateManager = createLazyComponent(
  () => import('@/components/BulkDuplicateManager'),
  <ModalLoadingFallback />
)

export const LazyBackupManager = createLazyComponent(
  () => import('@/components/backup/BackupManager').then(mod => ({ default: mod.BackupManager })),
  <ModalLoadingFallback />
)

// Lazy load AI components
export const LazyAIInsightsDashboard = createLazyComponent(
  () => import('@/components/ai/AIInsightsDashboard'),
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
      <div className="h-32 bg-gray-200 rounded animate-pulse" />
      <div className="flex space-x-2">
        <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
        <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
      </div>
    </div>
  </div>
)

export const LazyAIInsights = createLazyComponent(
  () => import('@/components/ai/AIInsights'),
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
      <div className="h-24 bg-gray-200 rounded animate-pulse" />
    </div>
  </div>
)

// Lazy load onboarding components
export const LazyWelcomeWizard = createLazyComponent(
  () => import('@/components/onboarding/WelcomeWizard').then(mod => ({ default: mod.WelcomeWizard })),
  <ModalLoadingFallback />
)

export const LazyFeatureTour = createLazyComponent(
  () => import('@/components/onboarding/FeatureTour').then(mod => ({ default: mod.FeatureTour })),
  null // No fallback needed for tour
)

// Lazy load profile components
export const LazyUserProfileModal = createLazyComponent(
  () => import('@/components/profile/UserProfileModal').then(mod => ({ default: mod.UserProfileModal })),
  <ModalLoadingFallback />
)

export const LazyDataManagementModal = createLazyComponent(
  () => import('@/components/profile/DataManagementModal').then(mod => ({ default: mod.DataManagementModal })),
  <ModalLoadingFallback />
)

// Lazy load CSV components
export const LazyTemplateGallery = createLazyComponent(
  () => import('@/components/csv/TemplateGallery'),
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <ApplicationCardSkeleton key={i} />
    ))}
  </div>
)

export const LazyDragDropFieldMapping = createLazyComponent(
  () => import('@/components/csv/DragDropFieldMapping'),
  <div className="space-y-4">
    <div className="h-8 bg-gray-200 rounded animate-pulse" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-32 bg-gray-200 rounded animate-pulse" />
      <div className="h-32 bg-gray-200 rounded animate-pulse" />
    </div>
  </div>
)

export const LazyImportPreview = createLazyComponent(
  () => import('@/components/csv/ImportPreview'),
  <div className="space-y-4">
    <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
    <div className="h-64 bg-gray-200 rounded animate-pulse" />
  </div>
)

export const LazyValidationReport = createLazyComponent(
  () => import('@/components/csv/ValidationReport'),
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
      </div>
    ))}
  </div>
)