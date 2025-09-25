import { useState, useEffect, useCallback } from 'react';
import { dashboardApiService, FoodLog, FoodItem } from '../../infrastructure/services/dashboardApi';
import { useAuth } from '../providers/AuthProvider';

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
  refreshTodaysMeals: () => Promise<void>;
  addFoodToMeal: (foodItemId: number, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', quantity: number, unit?: string, note?: string) => Promise<any>;
  handleVoiceLogSuccess: (foodLogs: any[]) => Promise<void>;
}

export function useFoodLogs(): UseFoodLogsReturn {
  const { user } = useAuth();
  const [todaysMeals, setTodaysMeals] = useState<Record<string, FoodLog[]>>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTodaysMeals = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Loading today\'s food logs...');
      
      const groupedLogs = await dashboardApiService.getTodaysFoodLogs(user.id);
      
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
      
      setTodaysMeals(enrichedLogs);
      
      console.log('Today\'s food logs loaded with enriched data:', enrichedLogs);
    } catch (err) {
      console.error('Failed to load today\'s food logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meals');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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
        note: note || ''
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
  }, [user?.id, refreshTodaysMeals]);

  // Handle voice log success - refresh meals data
  const handleVoiceLogSuccess = useCallback(async (foodLogs: any[]) => {
    console.log('Voice log success callback received:', foodLogs);
    
    // Refresh the meals data to include the new voice-logged foods
    await refreshTodaysMeals();
    
    console.log('Meals refreshed after voice log success');
  }, [refreshTodaysMeals]);

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
    refreshTodaysMeals,
    addFoodToMeal,
    handleVoiceLogSuccess,
  };
}
