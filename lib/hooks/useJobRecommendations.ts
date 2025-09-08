import { useState, useEffect, useCallback } from 'react';
import { JobRecommendation } from '@/lib/ai/jobRecommendationService';

interface UseJobRecommendationsOptions {
  status?: 'new' | 'viewed' | 'saved' | 'applied' | 'dismissed';
  limit?: number;
  autoFetch?: boolean;
}

interface UseJobRecommendationsReturn {
  recommendations: JobRecommendation[];
  loading: boolean;
  error: string | null;
  generating: boolean;
  fetchRecommendations: () => Promise<void>;
  generateRecommendations: (options?: { limit?: number; regenerate?: boolean }) => Promise<void>;
  updateRecommendationStatus: (id: string, status: 'viewed' | 'saved' | 'applied' | 'dismissed') => Promise<void>;
  deleteRecommendation: (id: string) => Promise<void>;
  getRecommendation: (id: string) => Promise<JobRecommendation | null>;
  refresh: () => Promise<void>;
}

export function useJobRecommendations(
  options: UseJobRecommendationsOptions = {}
): UseJobRecommendationsReturn {
  const { status, limit = 20, autoFetch = true } = options;
  
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`/api/ai/job-recommendations?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      if (data.success) {
        setRecommendations(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching job recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [status, limit]);

  const generateRecommendations = useCallback(async (
    options: { limit?: number; regenerate?: boolean } = {}
  ) => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/job-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: options.limit || 10,
          regenerate: options.regenerate || false
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate recommendations');
      }

      if (data.success) {
        // Refresh the recommendations list
        await fetchRecommendations();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to generate recommendations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error generating job recommendations:', err);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, [fetchRecommendations]);

  const updateRecommendationStatus = useCallback(async (
    id: string,
    newStatus: 'viewed' | 'saved' | 'applied' | 'dismissed'
  ) => {
    try {
      const response = await fetch(`/api/ai/job-recommendations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update recommendation');
      }

      if (data.success) {
        // Update the local state
        setRecommendations(prev =>
          prev.map(rec =>
            rec.id === id ? { ...rec, status: newStatus, updatedAt: new Date() } : rec
          )
        );
      } else {
        throw new Error(data.error || 'Failed to update recommendation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error updating recommendation status:', err);
      throw err;
    }
  }, []);

  const deleteRecommendation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/ai/job-recommendations/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete recommendation');
      }

      if (data.success) {
        // Remove from local state
        setRecommendations(prev => prev.filter(rec => rec.id !== id));
      } else {
        throw new Error(data.error || 'Failed to delete recommendation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error deleting recommendation:', err);
      throw err;
    }
  }, []);

  const getRecommendation = useCallback(async (id: string): Promise<JobRecommendation | null> => {
    try {
      const response = await fetch(`/api/ai/job-recommendations/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendation');
      }

      if (data.success) {
        // Update local state if the recommendation is in our current list
        setRecommendations(prev =>
          prev.map(rec =>
            rec.id === id ? data.data : rec
          )
        );
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch recommendation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching recommendation:', err);
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchRecommendations();
  }, [fetchRecommendations]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchRecommendations();
    }
  }, [autoFetch, fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    generating,
    fetchRecommendations,
    generateRecommendations,
    updateRecommendationStatus,
    deleteRecommendation,
    getRecommendation,
    refresh
  };
}

// Hook for getting recommendation statistics
export function useJobRecommendationStats() {
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    viewed: 0,
    saved: 0,
    applied: 0,
    dismissed: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all recommendations to calculate stats
      const response = await fetch('/api/ai/job-recommendations?limit=1000');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendation stats');
      }

      if (data.success) {
        const recommendations = data.data || [];
        const newStats = {
          total: recommendations.length,
          new: recommendations.filter((r: JobRecommendation) => r.status === 'new').length,
          viewed: recommendations.filter((r: JobRecommendation) => r.status === 'viewed').length,
          saved: recommendations.filter((r: JobRecommendation) => r.status === 'saved').length,
          applied: recommendations.filter((r: JobRecommendation) => r.status === 'applied').length,
          dismissed: recommendations.filter((r: JobRecommendation) => r.status === 'dismissed').length,
        };
        setStats(newStats);
      } else {
        throw new Error(data.error || 'Failed to fetch recommendation stats');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching recommendation stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  };
}