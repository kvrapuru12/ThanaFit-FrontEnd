import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardApiService, FoodLog, FoodItem } from '../../infrastructure/services/dashboardApi';
import { useAuth } from '../providers/AuthProvider';
import { startOfLocalDay, loggedAtIsoForBackdatedLocalDay } from '../../core/utils/dateUtils';

// Helper function to map meal type to food category
const getCategoryFromMealType = (mealType: string): string => {
  switch (mealType.toLowerCase()) {
    case 'breakfast':
      return 'dairy';
    case 'lunch':
      return 'grains';
    case 'dinner':
      return 'protein';
    case 'snack':
      return 'fruits';
    default:
      return 'snack';
  }
};

interface UseFoodLogsReturn {
  todaysMeals: Record<string, FoodLog[]>;
  loading: boolean;
  error: string | null;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  refreshTodaysMeals: (opts?: { silent?: boolean }) => Promise<void>;
  addFoodToMeal: (foodItemId: number, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', quantity: number, unit?: string, note?: string) => Promise<any>;
  handleVoiceLogSuccess: (foodLogs: any[]) => Promise<void>;
  deleteFoodLog: (id: number) => Promise<void>;
}

export function useFoodLogs(): UseFoodLogsReturn {
  const { user } = useAuth();
  const [selectedDate, setSelectedDateState] = useState(() => startOfLocalDay(new Date()));
  const [todaysMeals, setTodaysMeals] = useState<Record<string, FoodLog[]>>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestFetchRequestIdRef = useRef(0);
  const mealsCacheRef = useRef<Map<string, Record<string, FoodLog[]>>>(new Map());
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

  const refreshTodaysMeals = useCallback(async (opts?: { silent?: boolean }) => {
    if (!user?.id) return;

    const silent = opts?.silent === true;
    const requestId = ++latestFetchRequestIdRef.current;
    const localDateKey = selectedDate.toISOString().slice(0, 10);
    const cachedMeals = mealsCacheRef.current.get(localDateKey);
    try {
      if (cachedMeals) {
        setTodaysMeals(cachedMeals);
      }
      if (!silent && !cachedMeals && !hasLoadedOnceRef.current) {
        setLoading(true);
      }
      setError(null);
      console.log('Loading today\'s food logs...');
      
      const groupedLogs = await dashboardApiService.getTodaysFoodLogs(user.id, selectedDate);
      
      // Map backend FoodLog data to enriched format for display
      const enrichedLogs: Record<string, FoodLog[]> = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: []
      };

      for (const [mealType, logs] of Object.entries(groupedLogs)) {
        enrichedLogs[mealType] = logs.map((log) => {
          // Map backend FoodLog data to the expected format
          return {
            ...log,
            food: {
              id: log.foodItemId,
              name: log.foodItemName,
              category: getCategoryFromMealType(log.mealType), // Map meal type to category
              defaultUnit: log.unit,
              quantityPerUnit: 1, // Backend doesn't provide this, use 1 as default
              caloriesPerUnit: log.quantity > 0 ? log.calories / log.quantity : log.calories,
              proteinPerUnit: log.quantity > 0 ? log.protein / log.quantity : log.protein,
              carbsPerUnit: log.quantity > 0 ? log.carbs / log.quantity : log.carbs,
              fatPerUnit: log.quantity > 0 ? log.fat / log.quantity : log.fat,
              fiberPerUnit: log.quantity > 0 ? log.fiber / log.quantity : log.fiber,
              visibility: 'public',
              createdAt: log.createdAt,
              updatedAt: log.updatedAt
            }
          };
        });
      }
      
      if (requestId !== latestFetchRequestIdRef.current) {
        return;
      }
      mealsCacheRef.current.set(localDateKey, enrichedLogs);
      setTodaysMeals(enrichedLogs);
      hasLoadedOnceRef.current = true;
      
      console.log('Today\'s food logs loaded with enriched data:', enrichedLogs);
    } catch (err) {
      if (requestId !== latestFetchRequestIdRef.current) {
        return;
      }
      console.error('Failed to load today\'s food logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meals');
    } finally {
      if (!silent && requestId === latestFetchRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id, selectedDate]);

  const addFoodToMeal = useCallback(async (
    foodItemId: number, 
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', 
    quantity: number,
    unit?: string,
    note?: string
  ) => {
    if (!user?.id) return;

    try {
      console.log(`Adding food ${foodItemId} to ${mealType} with quantity ${quantity}${unit ? ` ${unit}` : ''}`);
      
      const response = await dashboardApiService.addFoodLog({
        userId: user.id,
        foodItemId,
        mealType,
        quantity,
        unit: unit || 'grams',
        note: note || '',
        loggedAt: loggedAtIsoForBackdatedLocalDay(selectedDate),
      });

      // Refresh the meals data to get the updated list
      await refreshTodaysMeals();

      console.log('Food added to meal successfully:', response);
      return response;
    } catch (err) {
      console.error('Failed to add food to meal:', err);
      setError(err instanceof Error ? err.message : 'Failed to add food to meal');
      throw err;
    }
  }, [user?.id, refreshTodaysMeals, selectedDate]);

  // Handle voice log success - refresh meals data
  const handleVoiceLogSuccess = useCallback(async (foodLogs: any[]) => {
    console.log('Voice log success callback received:', foodLogs);
    
    // Refresh the meals data to include the new voice-logged foods
    await refreshTodaysMeals();
    
    console.log('Meals refreshed after voice log success');
  }, [refreshTodaysMeals]);

  const deleteFoodLog = useCallback(
    async (id: number) => {
      if (!user?.id) {
        throw new Error('Not signed in');
      }
      await dashboardApiService.deleteFoodLog(id);
      await refreshTodaysMeals({ silent: true });
    },
    [user?.id, refreshTodaysMeals]
  );

  // Load today's meals on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      refreshTodaysMeals();
    }
  }, [user?.id, refreshTodaysMeals]);

  return {
    todaysMeals,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    refreshTodaysMeals,
    addFoodToMeal,
    handleVoiceLogSuccess,
    deleteFoodLog,
  };
}
