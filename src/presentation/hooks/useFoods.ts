import { useState, useEffect, useCallback } from 'react';
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

  const loadPopularFoods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading popular foods...');
      
      const popularFoods = await dashboardApiService.getPopularFoods(10);
      setFoods(popularFoods);
      
      console.log('Popular foods loaded:', popularFoods.length, 'items');
    } catch (err) {
      console.error('Failed to load popular foods:', err);
      setError(err instanceof Error ? err.message : 'Failed to load foods');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchFoods = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Searching foods with query:', query);
      
      const searchResults = await dashboardApiService.searchFoods(query, 10);
      setFoods(searchResults);
      
      console.log('Food search results:', searchResults.length, 'items');
    } catch (err) {
      console.error('Failed to search foods:', err);
      setError(err instanceof Error ? err.message : 'Failed to search foods');
    } finally {
      setLoading(false);
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
