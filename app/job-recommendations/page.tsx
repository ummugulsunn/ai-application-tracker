'use client'

import { useState, useEffect } from 'react'
import { JobRecommendationsDashboard } from '@/components/ai/JobRecommendationsDashboard'
import { useAuthStore } from '@/store/authStore'
import { SimpleAuth } from '@/components/auth/SimpleAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SparklesIcon, BriefcaseIcon } from '@heroicons/react/24/outline'

export default function JobRecommendationsPage() {
  const { isAuthenticated, user } = useAuthStore()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="text-center py-16 px-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <SparklesIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              AI İş Önerileri
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Yapay zeka destekli iş önerilerini görmek için giriş yapın veya misafir modunda devam edin.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => { setAuthMode('login'); setShowAuth(true) }}>
                Giriş Yap
              </Button>
              <Button 
                variant="outline"
                onClick={() => { setAuthMode('register'); setShowAuth(true) }}
              >
                Hesap Oluştur
              </Button>
            </div>
          </Card>

          <SimpleAuth
            isOpen={showAuth}
            onClose={() => setShowAuth(false)}
            mode={authMode}
            onModeChange={setAuthMode}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SparklesIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI İş Önerileri</h1>
          </div>
          <p className="text-lg text-gray-600">
            Profilinize ve deneyiminize uygun iş fırsatlarını keşfedin
          </p>
        </div>

        {/* AI Job Recommendations Dashboard */}
        <JobRecommendationsDashboard />
      </div>
    </div>
  )
}