import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardApiService, FoodItem } from '../../infrastructure/services/dashboardApi';

interface UseFoodsReturn {
  foods: FoodItem[];
  loading: boolean;
  error: string | null;
  searchFoods: (query: string) => Promise<void>;
  loadPopularFoods: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useFoods(): UseFoodsReturn {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestSearchRequestIdRef = useRef(0);

  const loadPopularFoods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const popularFoods = await dashboardApiService.getPopularFoods(10);
      setFoods(popularFoods);
    } catch (err) {
      console.error('Failed to load popular foods:', err);
      setError(err instanceof Error ? err.message : 'Failed to load foods');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchFoods = useCallback(async (query: string) => {
    const requestId = ++latestSearchRequestIdRef.current;
    try {
      setLoading(true);
      setError(null);

      const searchResults = await dashboardApiService.searchFoods(query, 10);
      if (requestId === latestSearchRequestIdRef.current) {
        setFoods(searchResults);
      }
    } catch (err) {
      console.error('Failed to search foods:', err);
      setError(err instanceof Error ? err.message : 'Failed to search foods');
    } finally {
      if (requestId === latestSearchRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadPopularFoods();
  }, [loadPopularFoods]);

  // Load popular foods on mount
  useEffect(() => {
    loadPopularFoods();
  }, [loadPopularFoods]);

  return {
    foods,
    loading,
    error,
    searchFoods,
    loadPopularFoods,
    refresh,
  };
}
