import { Metadata } from 'next';
import JobRecommendationsDashboard from '@/components/ai/JobRecommendationsDashboard';

export const metadata: Metadata = {
  title: 'Job Recommendations | AI Application Tracker',
  description: 'AI-powered job recommendations based on your profile and application history',
};

export default function JobRecommendationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JobRecommendationsDashboard />
      </div>
    </div>
  );
}