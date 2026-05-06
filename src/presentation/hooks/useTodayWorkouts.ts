import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardApiService, ActivityLog } from '../../infrastructure/services/dashboardApi';
import { useAuth } from '../providers/AuthProvider';
import { startOfLocalDay } from '../../core/utils/dateUtils';

export interface TodayWorkout {
  id: number;
  name: string;
  duration: string;
  calories: number;
  type: string;
}

export interface UseTodayWorkoutsReturn {
  todaysWorkouts: TodayWorkout[];
  isLoading: boolean;
  error: string | null;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  refresh: () => Promise<void>;
  deleteWorkout: (id: number) => Promise<void>;
}

export const useTodayWorkouts = (): UseTodayWorkoutsReturn => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDateState] = useState(() => startOfLocalDay(new Date()));
  const [todaysWorkouts, setTodaysWorkouts] = useState<TodayWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestFetchRequestIdRef = useRef(0);
  const workoutsCacheRef = useRef<Map<string, TodayWorkout[]>>(new Map());
  const hasLoadedOnceRef = useRef(false);

  const setSelectedDate = useCallback((d: Date) => {
    const normalized = startOfLocalDay(d);
    const today = startOfLocalDay(new Date());
    if (normalized.getTime() > today.getTime()) {
      setSelectedDateState(today);
      return;
    }
    setSelectedDateState(normalized);
  }, []);

  const fetchTodayWorkouts = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    const requestId = ++latestFetchRequestIdRef.current;
    const localDateKey = selectedDate.toISOString().slice(0, 10);
    const cachedWorkouts = workoutsCacheRef.current.get(localDateKey);
    try {
      if (cachedWorkouts) {
        setTodaysWorkouts(cachedWorkouts);
      }
      if (!silent && !cachedWorkouts && !hasLoadedOnceRef.current) {
        setIsLoading(true);
      }
      setError(null);
      
      console.log('=== FETCHING TODAY WORKOUTS ===');
      console.log('User ID:', user?.id);
      
      if (!user?.id) {
        console.warn('No user ID available, skipping fetch');
        if (requestId !== latestFetchRequestIdRef.current) {
          return;
        }
        setTodaysWorkouts([]);
        if (!silent && requestId === latestFetchRequestIdRef.current) {
          setIsLoading(false);
        }
        return;
      }
      
      // Try to fetch real data from backend
      console.log('Attempting to fetch real data from backend...');
      const activityLogs = await dashboardApiService.getTodayActivityLogs(user.id, selectedDate);
      if (requestId !== latestFetchRequestIdRef.current) {
        return;
      }
      
      console.log('=== BACKEND RESPONSE FOR USER 2 ===');
      console.log('Raw activity logs from backend:', JSON.stringify(activityLogs, null, 2));
      console.log('Number of activity logs:', activityLogs.length);
      
      if (activityLogs.length === 0) {
        console.log('No activity logs found for user 2 today');
        workoutsCacheRef.current.set(localDateKey, []);
        setTodaysWorkouts([]);
        hasLoadedOnceRef.current = true;
        return;
      }
      
      // Transform ActivityLog data to TodayWorkout format
      const transformedWorkouts: TodayWorkout[] = activityLogs.map((log) => ({
        id: log.id,
        name: log.activity?.name || log.note || 'Workout',
        duration: `${log.durationMinutes} min`,
        calories: Math.round(log.caloriesBurned),
        type: log.activity?.category || 'Workout',
      }));
      
      console.log('=== TRANSFORMED WORKOUTS ===');
      console.log('Transformed today workouts:', JSON.stringify(transformedWorkouts, null, 2));
      if (requestId !== latestFetchRequestIdRef.current) {
        return;
      }
      workoutsCacheRef.current.set(localDateKey, transformedWorkouts);
      setTodaysWorkouts(transformedWorkouts);
      hasLoadedOnceRef.current = true;
    } catch (err: any) {
      if (requestId !== latestFetchRequestIdRef.current) {
        return;
      }
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
      if (!silent && requestId === latestFetchRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, selectedDate]);

  const refresh = useCallback(async () => {
    await fetchTodayWorkouts();
  }, [fetchTodayWorkouts]);

  const deleteWorkout = useCallback(
    async (id: number) => {
      if (!user?.id) {
        throw new Error('Not signed in');
      }
      await dashboardApiService.deleteActivityLog(id);
      await fetchTodayWorkouts({ silent: true });
    },
    [user?.id, fetchTodayWorkouts]
  );

  // Fetch data on mount
  useEffect(() => {
    fetchTodayWorkouts();
  }, [fetchTodayWorkouts]);

  return {
    todaysWorkouts,
    isLoading,
    error,
    selectedDate,
    setSelectedDate,
    refresh,
    deleteWorkout,
  };
};
