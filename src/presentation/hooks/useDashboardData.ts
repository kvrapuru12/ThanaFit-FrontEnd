import { useState, useEffect, useCallback } from 'react';
import { dashboardApiService, DashboardStats, Meal, ActivityLog, WaterIntake, FoodLog, SleepEntry, WeightEntry, StepEntry } from '../../infrastructure/services/dashboardApi';
import { useAuth } from '../providers/AuthProvider';

export interface DashboardData {
  stats: DashboardStats;
  recentMeals: Meal[];
  activityLogs: ActivityLog[];
  waterIntake: WaterIntake[];
  foodLogs: FoodLog[];
  sleepEntries: SleepEntry[];
  weightEntries: WeightEntry[];
  stepEntries: StepEntry[];
}

export interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addActivityLog: (activityData: {
    activityName: string;
    caloriesBurned: number;
    duration: number;
    activityType: 'Cardio' | 'Strength' | 'Flexibility' | 'Sports' | 'Other';
  }) => Promise<void>;
  addWaterIntake: (amount: number, notes?: string) => Promise<void>;
  addFoodLog: (foodData: {
    foodName: string;
    calories: number;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    macros: {
      carbs: number;
      protein: number;
      fat: number;
    };
    servingSize: string;
    image?: string;
  }) => Promise<void>;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('=== FETCHING DASHBOARD DATA ===');
      const userGoals = {
        calorieIntakeTarget: user?.dailyCalorieIntakeTarget,
        calorieBurnTarget: user?.dailyCalorieBurnTarget
      };
      const dashboardData = await dashboardApiService.getDashboardData(user?.id, userGoals);
      
      console.log('Dashboard data fetched successfully:', JSON.stringify(dashboardData, null, 2));
      setData(dashboardData);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      
      // Set fallback data structure to prevent crashes
      setData({
        stats: {
          calories: { consumed: 0, goal: user?.dailyCalorieIntakeTarget || 2000 },
          macros: {
            carbs: { consumed: 0, goal: 250 },
            protein: { consumed: 0, goal: 120 },
            fat: { consumed: 0, goal: 65 }
          },
          water: { consumed: 0, goal: 2000 },
          exercise: { burned: 0, goal: user?.dailyCalorieBurnTarget || 400 }
        },
        recentMeals: [],
        activityLogs: [],
        waterIntake: [],
        foodLogs: [],
        sleepEntries: [],
        weightEntries: [],
        stepEntries: []
      });
      
      // Don't set error for dashboard since we have fallback data
      console.log('Using fallback dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  const addActivityLog = useCallback(async (activityData: {
    activityName: string;
    caloriesBurned: number;
    duration: number;
    activityType: 'Cardio' | 'Strength' | 'Flexibility' | 'Sports' | 'Other';
  }) => {
    try {
      console.log('Adding activity log:', activityData);
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
      
      console.log('Activity log added successfully');
    } catch (err: any) {
      console.error('Failed to add activity log:', err);
      throw err;
    }
  }, []);

  const addWaterIntake = useCallback(async (amount: number, notes?: string) => {
    try {
      console.log('Adding water intake:', { amount, notes });
      const newWaterIntake = await dashboardApiService.addWaterIntake(amount, notes);
      
      // Update local state
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          waterIntake: [newWaterIntake, ...prevData.waterIntake],
          stats: {
            ...prevData.stats,
            water: {
              ...prevData.stats.water,
              consumed: prevData.stats.water.consumed + amount
            }
          }
        };
      });
      
      console.log('Water intake added successfully');
    } catch (err: any) {
      console.error('Failed to add water intake:', err);
      throw err;
    }
  }, []);

  const addFoodLog = useCallback(async (foodData: {
    foodName: string;
    calories: number;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    macros: {
      carbs: number;
      protein: number;
      fat: number;
    };
    servingSize: string;
    image?: string;
  }) => {
    try {
      console.log('Adding food log:', foodData);
      const newFoodLog = await dashboardApiService.addFoodLog(foodData);
      
      // Update local state
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          foodLogs: [newFoodLog, ...prevData.foodLogs],
          recentMeals: [{
            id: newFoodLog.id.toString(),
            name: newFoodLog.foodItemName,
            calories: newFoodLog.calories,
            time: new Date(newFoodLog.loggedAt).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }),
            type: (newFoodLog.mealType.charAt(0).toUpperCase() + newFoodLog.mealType.slice(1)) as "Breakfast" | "Lunch" | "Dinner" | "Snack",
            image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5hbmF8ZW58MXx8fHwxNzU3NTMwMjY5fDA&ixlib=rb-4.1.0&q=80&w=300',
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
      
      console.log('Food log added successfully');
    } catch (err: any) {
      console.error('Failed to add food log:', err);
      throw err;
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    isLoading,
    error,
    refresh,
    addActivityLog,
    addWaterIntake,
    addFoodLog,
  };
};
