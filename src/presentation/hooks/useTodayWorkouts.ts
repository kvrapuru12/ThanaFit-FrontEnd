import { useState, useEffect, useCallback } from 'react';
import { dashboardApiService, ActivityLog } from '../../infrastructure/services/dashboardApi';
import { useAuth } from '../providers/AuthProvider';

export interface TodayWorkout {
  id: number;
  name: string;
  duration: string;
  calories: number;
  time: string;
  type: string;
}

export interface UseTodayWorkoutsReturn {
  todaysWorkouts: TodayWorkout[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useTodayWorkouts = (): UseTodayWorkoutsReturn => {
  const { user } = useAuth();
  const [todaysWorkouts, setTodaysWorkouts] = useState<TodayWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayWorkouts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('=== FETCHING TODAY WORKOUTS ===');
      console.log('User ID:', user?.id);
      
      if (!user?.id) {
        console.warn('No user ID available, skipping fetch');
        setTodaysWorkouts([]);
        setIsLoading(false);
        return;
      }
      
      // Try to fetch real data from backend
      console.log('Attempting to fetch real data from backend...');
      const activityLogs = await dashboardApiService.getTodayActivityLogs(user.id);
      
      console.log('=== BACKEND RESPONSE FOR USER 2 ===');
      console.log('Raw activity logs from backend:', JSON.stringify(activityLogs, null, 2));
      console.log('Number of activity logs:', activityLogs.length);
      
      if (activityLogs.length === 0) {
        console.log('No activity logs found for user 2 today');
        setTodaysWorkouts([]);
        return;
      }
      
      // Transform ActivityLog data to TodayWorkout format
      const transformedWorkouts: TodayWorkout[] = activityLogs.map((log) => ({
        id: log.id,
        name: log.activity?.name || log.note || 'Workout', // Use activity name first, then fallback to note
        duration: `${log.durationMinutes} min`,
        calories: Math.round(log.caloriesBurned),
        time: (() => {
          const rawTime = log.loggedAt;
          console.log(`=== TIME DEBUG FOR ${log.id} ===`);
          console.log(`Raw timestamp from backend: "${rawTime}"`);
          
          // Just extract the time part and show it as-is
          const timeMatch = rawTime.match(/(\d{2}):(\d{2}):(\d{2})/);
          
          if (timeMatch) {
            const [, hours, minutes, seconds] = timeMatch;
            const hour = parseInt(hours, 10);
            const minute = parseInt(minutes, 10);
            
            console.log(`Extracted: Hour=${hour}, Minute=${minute}`);
            
            // Simple conversion to 12-hour format
            let displayHour = hour;
            let ampm = 'AM';
            
            if (hour === 0) {
              displayHour = 12;
            } else if (hour === 12) {
              ampm = 'PM';
            } else if (hour > 12) {
              displayHour = hour - 12;
              ampm = 'PM';
            }
            
            const result = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
            console.log(`Final result: "${result}"`);
            
            return result;
          } else {
            console.log('No time match found, using raw string');
            return rawTime;
          }
        })(),
        type: log.activity?.category || 'Workout' // Use activity category if available
      }));
      
      console.log('=== TRANSFORMED WORKOUTS ===');
      console.log('Transformed today workouts:', JSON.stringify(transformedWorkouts, null, 2));
      setTodaysWorkouts(transformedWorkouts);
    } catch (err: any) {
      console.error('Failed to fetch today workouts:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      setError(`Failed to load today workouts: ${err.message}`);
      setTodaysWorkouts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    await fetchTodayWorkouts();
  }, [fetchTodayWorkouts]);

  // Fetch data on mount
  useEffect(() => {
    fetchTodayWorkouts();
  }, [fetchTodayWorkouts]);

  return {
    todaysWorkouts,
    isLoading,
    error,
    refresh,
  };
};
