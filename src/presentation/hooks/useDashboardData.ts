import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { dashboardApiService, DashboardStats, Meal, ActivityLog, WaterIntake, FoodLog, SleepEntry, WeightEntry, StepEntry } from '../../infrastructure/services/dashboardApi';
import { useAuth } from '../providers/AuthProvider';
import { addLocalCalendarDays, formatDateLocal, startOfLocalDay, toIsoUtcSeconds } from '../../core/utils/dateUtils';
import type { DashboardDailyResponse } from '../../core/types/appleHealthContracts';
import { getDashboardDaily, ingestAppleHealthSamples } from '../../infrastructure/services/appleHealthApi';
import {
  ensureAppleHealthStepReadAuthorization,
  readAppleHealthStepTotalForLocalDay,
} from '../../infrastructure/services/appleHealthStepsReader';
import {
  ensureAppleHealthSleepReadAuthorization,
  readAppleHealthAsleepStageHoursForLocalDay,
} from '../../infrastructure/services/appleHealthSleepReader';

function formatDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  if (!year || !month || !day) {
    throw new Error('Could not compute localDate in requested timezone.');
  }
  return `${year}-${month}-${day}`;
}

export interface DashboardData {
  stats: DashboardStats;
  recentMeals: Meal[];
  activityLogs: ActivityLog[];
  waterIntake: WaterIntake[];
  foodLogs: FoodLog[];
  sleepEntries: SleepEntry[];
  weightEntries: WeightEntry[];
  stepEntries: StepEntry[];
  /** Combined steps from GET /dashboard/daily when BE supports it; null if unavailable. */
  dailyStepsSummary: DashboardDailyResponse | null;
}

export interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  refresh: () => Promise<void>;
  addActivityLog: (activityData: {
    activityName: string;
    caloriesBurned: number;
    duration: number;
    activityType: 'Cardio' | 'Strength' | 'Flexibility' | 'Sports' | 'Other';
  }) => Promise<void>;
  addWaterIntake: (amount: number, notes?: string) => Promise<void>;
  addFoodLog: (foodData: {
    userId: number;
    foodItemId: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    quantity: number;
    unit?: string;
    note?: string;
    foodName: string;
    calories: number;
    macros: {
      carbs: number;
      protein: number;
      fat: number;
    };
    servingSize: string;
    image?: string;
  }) => Promise<void>;
  /** Canonical steps for UI: BE daily merge when present, else first manual step entry. */
  displayedSteps: number;
  /** Canonical sleep hours for UI: BE daily merge when present, else first manual sleep entry. */
  displayedSleepHours: number;
  /** iOS Apple Health manual sync only; idle on other platforms. */
  appleHealthSyncState: 'idle' | 'syncing' | 'denied' | 'error';
  syncAppleHealthStepsForSelectedDay: () => Promise<void>;
  appleHealthSleepSyncState: 'idle' | 'syncing' | 'denied' | 'error';
  syncAppleHealthSleepForSelectedDay: () => Promise<void>;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appleHealthSyncState, setAppleHealthSyncState] = useState<
    'idle' | 'syncing' | 'denied' | 'error'
  >('idle');
  const [appleHealthSleepSyncState, setAppleHealthSleepSyncState] = useState<
    'idle' | 'syncing' | 'denied' | 'error'
  >('idle');
  const [selectedDate, setSelectedDateState] = useState(() => startOfLocalDay(new Date()));

  const setSelectedDate = useCallback((d: Date) => {
    const normalized = startOfLocalDay(d);
    const today = startOfLocalDay(new Date());
    if (normalized.getTime() > today.getTime()) {
      setSelectedDateState(today);
      return;
    }
    setSelectedDateState(normalized);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.id) {
        setData(null);
        setError('Sign in to view your dashboard.');
        return;
      }

      const userGoals = {
        calorieIntakeTarget: user?.dailyCalorieIntakeTarget != null ? user.dailyCalorieIntakeTarget : undefined,
        calorieBurnTarget: user?.dailyCalorieBurnTarget != null ? user.dailyCalorieBurnTarget : undefined,
        targetCarbs: user?.targetCarbs != null ? user.targetCarbs : undefined,
        targetProtein: user?.targetProtein != null ? user.targetProtein : undefined,
        targetFat: user?.targetFat != null ? user.targetFat : undefined,
        targetWaterLitres: user?.targetWaterLitres != null ? user.targetWaterLitres : undefined
      };
      const dashboardData = await dashboardApiService.getDashboardData(user.id, userGoals, {
        summaryDate: selectedDate,
      });

      let dailyStepsSummary: DashboardDailyResponse | null = null;
      try {
        const timeZone =
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const localDate = formatDateLocal(selectedDate);
        dailyStepsSummary = await getDashboardDaily(localDate, timeZone);
      } catch (dailyErr) {
        console.warn('GET /dashboard/daily unavailable or failed:', dailyErr);
        dailyStepsSummary = null;
      }

      setData({ ...dashboardData, dailyStepsSummary });
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setData(null);
      setError(err?.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, [
    user?.id,
    user?.dailyCalorieIntakeTarget,
    user?.dailyCalorieBurnTarget,
    user?.targetCarbs,
    user?.targetProtein,
    user?.targetFat,
    user?.targetWaterLitres,
    selectedDate,
  ]);

  const refresh = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  const displayedSteps = useMemo(() => {
    if (!data) return 0;
    const fromDaily = data.dailyStepsSummary?.steps?.displayedSteps;
    if (typeof fromDaily === 'number' && !Number.isNaN(fromDaily)) {
      return fromDaily;
    }
    if (data.stepEntries?.length) {
      return data.stepEntries[0].stepCount;
    }
    return 0;
  }, [data]);

  const displayedSleepHours = useMemo(() => {
    if (!data) return 0;
    const fromDaily = data.dailyStepsSummary?.sleep?.displayedSleepHours;
    if (typeof fromDaily === 'number' && !Number.isNaN(fromDaily)) {
      return fromDaily;
    }
    if (data.sleepEntries?.length) {
      return (
        data.sleepEntries[0].hours ??
        data.sleepEntries[0].durationHours ??
        data.sleepEntries[0].sleepHours ??
        0
      );
    }
    return 0;
  }, [data]);

  const syncAppleHealthStepsForSelectedDay = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Health sync is only available on iPhone.');
    }
    if (!user?.id) {
      throw new Error('User not found');
    }

    setAppleHealthSyncState('syncing');
    try {
      const ok = await ensureAppleHealthStepReadAuthorization();
      if (!ok) {
        setAppleHealthSyncState('denied');
        throw new Error('Apple Health access was not granted.');
      }

      const total = await readAppleHealthStepTotalForLocalDay(selectedDate);
      if (total == null) {
        setAppleHealthSyncState('error');
        throw new Error('Could not read step count from Apple Health.');
      }

      const anchorTimeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const localDate = formatDateLocal(selectedDate);
      const dayStart = startOfLocalDay(selectedDate);
      const dayEndExclusive = addLocalCalendarDays(dayStart, 1);
      const externalSampleId = `HKQuantityTypeIdentifierStepCount:${localDate}:${anchorTimeZone}`;

      const ingestRes = await ingestAppleHealthSamples({
        clientIngestSchemaVersion: 2,
        anchorTimeZone,
        samples: [
          {
            metric: 'STEPS',
            externalSampleId,
            localDate,
            start: toIsoUtcSeconds(dayStart),
            end: toIsoUtcSeconds(dayEndExclusive),
            value: total,
          },
        ],
      });

      const rejected = ingestRes.rejected ?? 0;
      const accepted = ingestRes.accepted ?? 0;
      const unchanged = ingestRes.unchanged ?? 0;
      if (rejected > 0 && accepted === 0 && unchanged === 0) {
        const msg =
          ingestRes.results?.find((r) => r.status === 'REJECTED')?.message ||
          'Apple Health ingest was rejected.';
        setAppleHealthSyncState('error');
        throw new Error(msg);
      }

      await fetchDashboardData();
      setAppleHealthSyncState('idle');
    } catch (e) {
      setAppleHealthSyncState((prev) =>
        prev === 'syncing' ? 'error' : prev
      );
      throw e;
    }
  }, [user?.id, selectedDate, fetchDashboardData]);

  const syncAppleHealthSleepForSelectedDay = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Health sync is only available on iPhone.');
    }
    if (!user?.id) {
      throw new Error('User not found');
    }

    setAppleHealthSleepSyncState('syncing');
    try {
      const ok = await ensureAppleHealthSleepReadAuthorization();
      if (!ok) {
        setAppleHealthSleepSyncState('denied');
        throw new Error('Apple Health access was not granted.');
      }

      const byStage = await readAppleHealthAsleepStageHoursForLocalDay(selectedDate);
      if (byStage == null) {
        setAppleHealthSleepSyncState('error');
        throw new Error('Could not read sleep from Apple Health.');
      }

      const anchorTimeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const samples = byStage.map((item) => ({
        metric: 'SLEEP' as const,
        sleepStage: item.sleepStage,
        externalSampleId: item.externalSampleId,
        localDate: formatDateInTimeZone(item.end, anchorTimeZone),
        start: toIsoUtcSeconds(item.start),
        end: toIsoUtcSeconds(item.end),
        value: 0,
      }));

      if (samples.length === 0) {
        setAppleHealthSleepSyncState('error');
        throw new Error('No asleep sleep-stage data found for this date.');
      }

      const ingestRes = await ingestAppleHealthSamples({
        clientIngestSchemaVersion: 2,
        anchorTimeZone,
        samples,
      });

      const rejected = ingestRes.rejected ?? 0;
      const accepted = ingestRes.accepted ?? 0;
      const unchanged = ingestRes.unchanged ?? 0;
      if (rejected > 0 && accepted === 0 && unchanged === 0) {
        const msg =
          ingestRes.results?.find((r) => r.status === 'REJECTED')?.message ||
          'Apple Health ingest was rejected.';
        setAppleHealthSleepSyncState('error');
        throw new Error(msg);
      }

      await fetchDashboardData();
      setAppleHealthSleepSyncState('idle');
    } catch (e) {
      setAppleHealthSleepSyncState((prev) =>
        prev === 'syncing' ? 'error' : prev
      );
      throw e;
    }
  }, [user?.id, selectedDate, fetchDashboardData]);

  const addActivityLog = useCallback(async (activityData: {
    activityName: string;
    caloriesBurned: number;
    duration: number;
    activityType: 'Cardio' | 'Strength' | 'Flexibility' | 'Sports' | 'Other';
  }) => {
    try {
      const newActivity = await dashboardApiService.addActivityLog(activityData);
      
      // Update local state
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          activityLogs: [newActivity, ...prevData.activityLogs],
          stats: {
            ...prevData.stats,
            exercise: {
              ...prevData.stats.exercise,
              burned: prevData.stats.exercise.burned + activityData.caloriesBurned
            }
          }
        };
      });
      
    } catch (err: any) {
      console.error('Failed to add activity log:', err);
      throw err;
    }
  }, []);

  const addWaterIntake = useCallback(async (amount: number, notes?: string) => {
    try {
      if (!user?.id) {
        throw new Error('User not found');
      }
      await dashboardApiService.addOrAccumulateTodayWaterIntake(user.id, amount, notes);
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Failed to add water intake:', err);
      throw err;
    }
  }, [user, fetchDashboardData]);

  const addFoodLog = useCallback(async (foodData: {
    userId: number;
    foodItemId: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    quantity: number;
    unit?: string;
    note?: string;
    foodName: string;
    calories: number;
    macros: {
      carbs: number;
      protein: number;
      fat: number;
    };
    servingSize: string;
    image?: string;
  }) => {
    try {
      const newFoodLog = await dashboardApiService.addFoodLog({
        userId: foodData.userId,
        foodItemId: foodData.foodItemId,
        mealType: foodData.mealType,
        quantity: foodData.quantity,
        unit: foodData.unit,
        note: foodData.note
      });
      
      // Update local state
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          foodLogs: [{
            id: newFoodLog.id,
            userId: foodData.userId,
            foodId: foodData.foodItemId,
            mealType: foodData.mealType,
            quantity: foodData.quantity,
            loggedAt: newFoodLog.createdAt,
            createdAt: newFoodLog.createdAt,
            updatedAt: newFoodLog.createdAt,
            food: {
              id: foodData.foodItemId,
              name: foodData.foodName,
              category: 'protein',
              defaultUnit: foodData.unit || 'grams',
              quantityPerUnit: foodData.quantity,
              caloriesPerUnit: foodData.calories,
              proteinPerUnit: foodData.macros.protein,
              carbsPerUnit: foodData.macros.carbs,
              fatPerUnit: foodData.macros.fat,
              fiberPerUnit: 0,
              visibility: 'public',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          } as FoodLog, ...prevData.foodLogs],
          recentMeals: [{
            id: newFoodLog.id.toString(),
            name: foodData.foodName,
            calories: newFoodLog.calories,
            time: new Date(newFoodLog.createdAt).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }),
            type: (foodData.mealType.charAt(0).toUpperCase() + foodData.mealType.slice(1)) as "Breakfast" | "Lunch" | "Dinner" | "Snack",
            image: foodData.image || 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5hbmF8ZW58MXx8fHwxNzU3NTMwMjY5fDA&ixlib=rb-4.1.0&q=80&w=300',
            macros: {
              protein: newFoodLog.protein,
              carbs: newFoodLog.carbs,
              fat: newFoodLog.fat
            }
          }, ...prevData.recentMeals],
          stats: {
            ...prevData.stats,
            calories: {
              ...prevData.stats.calories,
              consumed: prevData.stats.calories.consumed + foodData.calories
            },
            macros: {
              carbs: {
                ...prevData.stats.macros.carbs,
                consumed: prevData.stats.macros.carbs.consumed + foodData.macros.carbs
              },
              protein: {
                ...prevData.stats.macros.protein,
                consumed: prevData.stats.macros.protein.consumed + foodData.macros.protein
              },
              fat: {
                ...prevData.stats.macros.fat,
                consumed: prevData.stats.macros.fat.consumed + foodData.macros.fat
              }
            }
          }
        };
      });
      
    } catch (err: any) {
      console.error('Failed to add food log:', err);
      throw err;
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const isRefreshing = isLoading && data !== null;

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    selectedDate,
    setSelectedDate,
    refresh,
    addActivityLog,
    addWaterIntake,
    addFoodLog,
    displayedSteps,
    displayedSleepHours,
    appleHealthSyncState,
    syncAppleHealthStepsForSelectedDay,
    appleHealthSleepSyncState,
    syncAppleHealthSleepForSelectedDay,
  };
};
