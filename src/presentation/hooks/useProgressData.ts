import { useState, useEffect, useCallback } from 'react';
import { progressApiService, WeeklyDataPoint, GoalStats, MacroDistribution, Achievement } from '../../infrastructure/services/progressApi';
import { useAuth } from '../providers/AuthProvider';

export interface ProgressData {
  weeklyData: WeeklyDataPoint[];
  goalStats: GoalStats;
  macroDistribution: MacroDistribution;
  achievements: Achievement[];
}

export interface UseProgressDataReturn {
  data: ProgressData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useProgressData = (): UseProgressDataReturn => {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressData = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available, skipping progress data fetch');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('=== FETCHING PROGRESS DATA ===');
      console.log('User ID:', user.id);

      // Fetch all progress data in parallel (excluding achievements)
      const [weeklyData, goalStats, macroDistribution] = await Promise.all([
        progressApiService.getWeeklyData(user.id),
        progressApiService.getGoalStats(user.id, {
          calorieIntakeTarget: user.dailyCalorieIntakeTarget || undefined,
          calorieBurnTarget: user.dailyCalorieBurnTarget || undefined,
          targetWeight: user.targetWeight || undefined,
          targetWater: 2000, // Default 2L in ml
        }),
        progressApiService.getMacroDistribution(user.id),
      ]);

      const progressData: ProgressData = {
        weeklyData,
        goalStats,
        macroDistribution,
        achievements: [], // Achievements removed
      };

      console.log('Progress data fetched successfully:', progressData);
      setData(progressData);
    } catch (err: any) {
      console.error('Failed to fetch progress data:', err);
      setError(err?.message || 'Failed to load progress data');
      
      // Set fallback data to prevent crashes
      setData({
        weeklyData: [],
        goalStats: {
          calories: { current: 0, goal: user?.dailyCalorieIntakeTarget || 2000, percentage: 0 },
          exercise: { current: 0, goal: user?.dailyCalorieBurnTarget || 400, percentage: 0 },
          weight: { current: null, goal: user?.targetWeight || null, percentage: 0 },
          water: { current: 0, goal: 8, percentage: 0 },
        },
        macroDistribution: {
          carbs: { value: 0, percentage: 0 },
          protein: { value: 0, percentage: 0 },
          fat: { value: 0, percentage: 0 },
        },
        achievements: [], // Achievements removed
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refresh = useCallback(async () => {
    await fetchProgressData();
  }, [fetchProgressData]);

  // Fetch data on mount and when user changes
  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
};
