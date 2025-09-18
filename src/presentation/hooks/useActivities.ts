import { useState, useEffect, useCallback } from 'react';
import { dashboardApiService, Activity } from '../../infrastructure/services/dashboardApi';
import { useAuth } from '../providers/AuthProvider';

export interface UseActivitiesReturn {
  activities: Activity[];
  quickWorkouts: Activity[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  searchActivities: (searchQuery: string) => Promise<void>;
}

export const useActivities = (): UseActivitiesReturn => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [quickWorkouts, setQuickWorkouts] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (search?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('=== FETCHING ACTIVITIES ===');
      
      // Fetch public activities for popular exercises
      const publicActivities = await dashboardApiService.getActivities(search, 'PUBLIC', 1, 20);
      console.log('Public activities fetched successfully:', JSON.stringify(publicActivities, null, 2));
      setActivities(publicActivities);
      
      // Fetch all activities (public + private) for quick workouts
      const allActivities = await dashboardApiService.getActivities(search, undefined, 1, 50);
      console.log('All activities fetched successfully:', JSON.stringify(allActivities, null, 2));
      
      // Filter all activities for quick workouts (more inclusive filtering)
      const quickWorkoutActivities = allActivities.filter(activity => {
        const category = activity.category.toLowerCase();
        const name = activity.name.toLowerCase();
        
        // More inclusive criteria for quick workouts
        const isQuickWorkout = 
          category.includes('hiit') || 
          category.includes('quick') || 
          category.includes('cardio') || 
          category.includes('stretching') ||
          category.includes('core') ||
          category.includes('strength') ||
          category.includes('fitness') ||
          category.includes('workout') ||
          category.includes('training') ||
          name.includes('hiit') ||
          name.includes('quick') ||
          name.includes('cardio') ||
          name.includes('strength') ||
          name.includes('core') ||
          activity.caloriesPerMinute >= 5; // Lower threshold for more activities
        
        console.log(`Activity: ${activity.name} (${category}) - Calories: ${activity.caloriesPerMinute} - IsQuickWorkout: ${isQuickWorkout}`);
        return isQuickWorkout;
      }).slice(0, 4); // Limit to 4 quick workouts
      
      console.log('Filtered quick workouts:', JSON.stringify(quickWorkoutActivities, null, 2));
      
      // If we don't have enough quick workouts, add more activities as fallback
      if (quickWorkoutActivities.length < 4 && allActivities.length > quickWorkoutActivities.length) {
        const remainingActivities = allActivities.filter(activity => 
          !quickWorkoutActivities.some(qw => qw.id === activity.id)
        );
        const additionalWorkouts = remainingActivities.slice(0, 4 - quickWorkoutActivities.length);
        quickWorkoutActivities.push(...additionalWorkouts);
        console.log('Added fallback activities:', JSON.stringify(additionalWorkouts, null, 2));
      }
      
      setQuickWorkouts(quickWorkoutActivities);
    } catch (err: any) {
      console.error('Failed to fetch activities:', err);
      setError('Failed to load exercises');
      setActivities([]);
      setQuickWorkouts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchActivities();
  }, [fetchActivities]);

  const searchActivities = useCallback(async (searchQuery: string) => {
    await fetchActivities(searchQuery);
  }, [fetchActivities]);

  // Fetch activities on mount
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    quickWorkouts,
    isLoading,
    error,
    refresh,
    searchActivities,
  };
};
