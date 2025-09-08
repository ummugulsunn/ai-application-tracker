'use client';

import React, { useState } from 'react';
import { useJobRecommendations, useJobRecommendationStats } from '@/lib/hooks/useJobRecommendations';
import { JobRecommendation } from '@/lib/ai/jobRecommendationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  SparklesIcon,
  EyeIcon,
  BookmarkIcon,
  CheckIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ClockIcon,
  RefreshIcon,
  FunnelIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { 
  SparklesIcon as SparklesIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';

interface JobRecommendationCardProps {
  recommendation: JobRecommendation;
  onStatusUpdate: (id: string, status: 'viewed' | 'saved' | 'applied' | 'dismissed') => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function JobRecommendationCard({ recommendation, onStatusUpdate, onDelete }: JobRecommendationCardProps) {
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (status: 'viewed' | 'saved' | 'applied' | 'dismissed') => {
    setUpdating(true);
    try {
      await onStatusUpdate(recommendation.id, status);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this recommendation?')) {
      try {
        await onDelete(recommendation.id);
      } catch (error) {
        console.error('Error deleting recommendation:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-gray-100 text-gray-800';
      case 'saved': return 'bg-yellow-100 text-yellow-800';
      case 'applied': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      recommendation.status === 'new' ? 'ring-2 ring-blue-200' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {recommendation.jobTitle}
              </CardTitle>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recommendation.status)}`}>
                {recommendation.status}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <BuildingOfficeIcon className="w-4 h-4" />
                <span className="font-medium">{recommendation.company}</span>
              </div>
              
              {recommendation.location && (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{recommendation.location}</span>
                </div>
              )}
              
              {recommendation.salaryRange && (
                <div className="flex items-center gap-1">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  <span>{recommendation.salaryRange}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <StarIcon className={`w-4 h-4 ${getMatchScoreColor(recommendation.matchScore)}`} />
                <span className={`text-sm font-medium ${getMatchScoreColor(recommendation.matchScore)}`}>
                  {recommendation.matchScore}% match
                </span>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <ClockIcon className="w-3 h-3" />
                <span>{new Date(recommendation.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Job Description */}
        {recommendation.jobDescription && (
          <div className="mb-4">
            <p className="text-sm text-gray-700 line-clamp-3">
              {recommendation.jobDescription}
            </p>
          </div>
        )}

        {/* Requirements */}
        {recommendation.requirements && recommendation.requirements.length > 0 && (
          <div className="mb-4">
            <h5 className="text-xs font-medium text-gray-900 mb-2">Key Requirements</h5>
            <div className="flex flex-wrap gap-1">
              {recommendation.requirements.slice(0, 5).map((req, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                >
                  {req}
                </span>
              ))}
              {recommendation.requirements.length > 5 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                  +{recommendation.requirements.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Match Reasons */}
        {recommendation.matchReasons && recommendation.matchReasons.length > 0 && (
          <div className="mb-4">
            <h5 className="text-xs font-medium text-gray-900 mb-2">Why this matches</h5>
            <ul className="space-y-1">
              {recommendation.matchReasons.slice(0, 3).map((reason, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {recommendation.status !== 'saved' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate('saved')}
                disabled={updating}
                className="flex items-center gap-1"
              >
                <BookmarkIcon className="w-4 h-4" />
                Save
              </Button>
            )}
            
            {recommendation.status !== 'applied' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate('applied')}
                disabled={updating}
                className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
              >
                <CheckIcon className="w-4 h-4" />
                Applied
              </Button>
            )}
            
            {recommendation.jobUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(recommendation.jobUrl, '_blank')}
                className="flex items-center gap-1"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                View Job
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {recommendation.status !== 'dismissed' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusUpdate('dismissed')}
                disabled={updating}
                className="text-gray-400 hover:text-red-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function JobRecommendationsDashboard() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'saved' | 'applied'>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  const { stats, loading: statsLoading } = useJobRecommendationStats();
  const { 
    recommendations, 
    loading, 
    error, 
    generating,
    fetchRecommendations,
    generateRecommendations,
    updateRecommendationStatus,
    deleteRecommendation
  } = useJobRecommendations({
    status: activeFilter === 'all' ? undefined : activeFilter as any,
    limit: 50
  });

  const handleGenerateRecommendations = async (options: { limit: number; regenerate: boolean }) => {
    try {
      await generateRecommendations(options);
      setShowGenerateModal(false);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (activeFilter === 'all') return true;
    return rec.status === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Recommendations</h1>
          <p className="text-gray-600 mt-1">AI-powered job matches based on your profile and application history</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fetchRecommendations()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={() => setShowGenerateModal(true)}
            disabled={generating}
            className="flex items-center gap-2"
          >
            <SparklesIcon className="w-4 h-4" />
            {generating ? 'Generating...' : 'Generate New'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <SparklesIconSolid className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New</p>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">{stats.new}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saved</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.saved}</p>
              </div>
              <BookmarkIconSolid className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Applied</p>
                <p className="text-2xl font-bold text-green-600">{stats.applied}</p>
              </div>
              <CheckIcon className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dismissed</p>
                <p className="text-2xl font-bold text-red-600">{stats.dismissed}</p>
              </div>
              <XMarkIcon className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <FunnelIcon className="w-5 h-5 text-gray-400" />
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'All', count: stats.total },
            { key: 'new', label: 'New', count: stats.new },
            { key: 'saved', label: 'Saved', count: stats.saved },
            { key: 'applied', label: 'Applied', count: stats.applied }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <XMarkIcon className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recommendations Grid */}
      {!loading && filteredRecommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((recommendation) => (
            <JobRecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onStatusUpdate={updateRecommendationStatus}
              onDelete={deleteRecommendation}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRecommendations.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeFilter === 'all' ? 'No recommendations yet' : `No ${activeFilter} recommendations`}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeFilter === 'all' 
                ? 'Generate AI-powered job recommendations based on your profile and application history.'
                : `You don't have any ${activeFilter} recommendations yet.`
              }
            </p>
            {activeFilter === 'all' && (
              <Button
                onClick={() => setShowGenerateModal(true)}
                disabled={generating}
                className="flex items-center gap-2 mx-auto"
              >
                <SparklesIcon className="w-4 h-4" />
                Generate Recommendations
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Generate Job Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of recommendations
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="10"
                  id="recommendation-limit"
                >
                  <option value="5">5 recommendations</option>
                  <option value="10">10 recommendations</option>
                  <option value="15">15 recommendations</option>
                  <option value="20">20 recommendations</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="regenerate"
                  className="rounded border-gray-300"
                />
                <label htmlFor="regenerate" className="text-sm text-gray-700">
                  Replace existing new recommendations
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={() => {
                    const limit = parseInt((document.getElementById('recommendation-limit') as HTMLSelectElement).value);
                    const regenerate = (document.getElementById('regenerate') as HTMLInputElement).checked;
                    handleGenerateRecommendations({ limit, regenerate });
                  }}
                  disabled={generating}
                  className="flex-1"
                >
                  {generating ? 'Generating...' : 'Generate'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={generating}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}