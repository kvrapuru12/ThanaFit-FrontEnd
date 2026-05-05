import { validateActivityVoiceTextLength } from '../../core/utils/voiceUtils';
import { apiClient } from '../api/ApiClient';

export interface VoiceFoodLogEntry {
  food: string;
  quantity: number;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  compositeMeal?: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  loggedAt?: string;
}

export interface VoiceFoodLogResponse {
  message: string;
  logs: VoiceFoodLogEntry[];
  errorCode?: string;
}

// Dashboard Data Types
export interface DashboardStats {
  calories: {
    consumed: number;
    goal: number;
  };
  macros: {
    carbs: { consumed: number; goal: number };
    protein: { consumed: number; goal: number };
    fat: { consumed: number; goal: number };
  };
  water: {
    consumed: number;
    goal: number;
  };
  exercise: {
    burned: number;
    goal: number;
  };
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  time: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  image?: string;
  /** Nested food.category when API sends it */
  foodCategory?: string;
  macros?: {
    carbs: number;
    protein: number;
    fat: number;
  };
}

export interface ActivityLog {
  id: number;
  userId: number;
  activityId: number;
  loggedAt: string;
  durationMinutes: number; // in minutes
  caloriesBurned: number;
  note: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  activity?: Activity; // Include activity details if available
}

// Food Types
export interface FoodItem {
  id: number;
  name: string;
  category: string;
  defaultUnit: string;
  quantityPerUnit: number;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  fiberPerUnit: number;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodsResponse {
  foodItems: FoodItem[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Food Log Types
export interface FoodLog {
  id: number;
  userId: number;
  foodId: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity: number;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
  food?: FoodItem; // Include food details if available
}

export interface FoodLogsResponse {
  foodLogs: FoodLog[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface WaterIntake {
  id: number;
  userId: number;
  loggedAt: string;
  amount: number; // in ml
  note: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SleepEntry {
  id: number;
  userId: number;
  loggedAt: string;
  hours?: number; // Changed from durationHours to hours
  durationHours?: number; // Alternative field name
  sleepHours?: number; // Another possible field name
  note?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoodEntry {
  id: number;
  userId: number;
  loggedAt: string;
  mood: string; // Changed from enum to string (e.g., "HAPPY")
  intensity: number; // Changed from energy/stress to intensity
  note?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeightEntry {
  id: number;
  userId: number;
  loggedAt: string;
  weight?: number; // in kg
  weightKg?: number; // Alternative field name
  weightValue?: number; // Another possible field name
  note?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface StepEntry {
  id: number;
  userId: number;
  loggedAt: string;
  stepCount: number; // Changed from 'steps' to 'stepCount' to match backend
  note?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodLog {
  id: number;
  userId: number;
  foodItemId: number;
  foodItemName: string;
  loggedAt: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: number;
  name: string;
  category: string;
  caloriesPerMinute: number;
  visibility: string;
  createdById: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivitiesResponse {
  items: Activity[];
  page: number;
  limit: number;
  total: number;
}

// Dashboard API Service
export class DashboardApiService {
  private baseUrl = '/dashboard';

  /**
   * Get today's dashboard statistics
   */
  async getTodayStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>(`${this.baseUrl}/stats/today`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch today stats:', error);
      throw error;
    }
  }

  /**
   * Get recent meals for today
   */
  async getRecentMeals(): Promise<Meal[]> {
    try {
      const response = await apiClient.get<Meal[]>(`${this.baseUrl}/meals/recent`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recent meals:', error);
      throw error;
    }
  }

  /**
   * Get today's activity logs with activity details
   */
  async getTodayActivityLogs(userId?: number, day?: Date): Promise<ActivityLog[]> {
    try {
      const ref = day ?? new Date();
      const startOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0);
      const endOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59);
      
      const from = startOfDay.toISOString();
      const to = endOfDay.toISOString();
      
      const endpoint = `/activity-logs?userId=${userId || 2}&from=${from}&to=${to}&page=1&limit=20&sortBy=loggedAt&sortDir=desc`;
      console.log('Making API call to:', endpoint);
      
      // Use the correct backend endpoint with proper parameters (removed /api prefix to avoid duplication)
      const response = await apiClient.get<{ items: ActivityLog[] }>(endpoint);
      const activityLogs = response.data.items || [];
      
      console.log('Activity logs fetched successfully:', activityLogs);
      
      // Fetch activity details for each log to get the activity name
      const enrichedLogs = await Promise.all(
        activityLogs.map(async (log) => {
          try {
            // Fetch activity details using the activityId
            const activityResponse = await apiClient.get<Activity>(`/activities/${log.activityId}`);
            console.log(`Fetched activity details for activityId ${log.activityId}:`, activityResponse.data);
            return {
              ...log,
              activity: activityResponse.data
            };
          } catch (activityError) {
            console.warn(`Failed to fetch activity details for activityId ${log.activityId}:`, activityError);
            // Return log without activity details if fetch fails
            return log;
          }
        })
      );
      
      console.log('Enriched activity logs with activity details:', enrichedLogs);
      return enrichedLogs;
    } catch (error) {
      console.error('Failed to fetch today activity logs:', error);
      throw error;
    }
  }

  /**
   * Get today's water intake
   */
  async getTodayWaterIntake(userId?: number, day?: Date): Promise<WaterIntake[]> {
    try {
      const ref = day ?? new Date();
      const startOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0);
      const endOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59);
      
      const from = startOfDay.toISOString();
      const to = endOfDay.toISOString();
      
      // Use the actual backend endpoint
      const response = await apiClient.get<{ items: WaterIntake[] }>(`/water?userId=${userId || 2}&from=${from}&to=${to}&page=1&limit=50`);
      return response.data.items || [];
    } catch (error) {
      console.error('Failed to fetch today water intake:', error);
      throw error;
    }
  }

  /**
   * Get today's sleep entries
   */
  async getTodaySleepEntries(userId?: number, day?: Date): Promise<SleepEntry[]> {
    try {
      const ref = day ?? new Date();
      const startOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0);
      const endOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59);
      
      const from = startOfDay.toISOString();
      const to = endOfDay.toISOString();
      
      const response = await apiClient.get<{ items: SleepEntry[] }>(`/sleeps?userId=${userId || 2}&from=${from}&to=${to}&page=1&limit=50`);
      console.log('Sleep API Response:', JSON.stringify(response.data, null, 2));
      return response.data.items || [];
    } catch (error) {
      console.error('Failed to fetch today sleep entries:', error);
      throw error;
    }
  }


  /**
   * Get today's weight entries
   */
  async getTodayWeightEntries(userId?: number, day?: Date): Promise<WeightEntry[]> {
    try {
      const ref = day ?? new Date();
      const startOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0);
      const endOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59);
      
      const from = startOfDay.toISOString();
      const to = endOfDay.toISOString();
      
      const response = await apiClient.get<{ items: WeightEntry[] }>(`/weights?userId=${userId || 2}&from=${from}&to=${to}&page=1&limit=50`);
      console.log('Weight API Response:', JSON.stringify(response.data, null, 2));
      return response.data.items || [];
    } catch (error) {
      console.error('Failed to fetch today weight entries:', error);
      throw error;
    }
  }

  /**
   * Get today's step entries
   */
  async getTodayStepEntries(userId?: number, day?: Date): Promise<StepEntry[]> {
    try {
      const ref = day ?? new Date();
      const startOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0);
      const endOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59);
      
      const from = startOfDay.toISOString();
      const to = endOfDay.toISOString();
      
      const response = await apiClient.get<{ items: StepEntry[] }>(`/steps?userId=${userId || 2}&from=${from}&to=${to}&page=1&limit=50`);
      console.log('Steps API Response:', JSON.stringify(response.data, null, 2));
      return response.data.items || [];
    } catch (error) {
      console.error('Failed to fetch today step entries:', error);
      throw error;
    }
  }

  /**
   * Get today's food logs
   */
  async getTodayFoodLogs(userId?: number, day?: Date): Promise<FoodLog[]> {
    try {
      const ref = day ?? new Date();
      const startOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0);
      const endOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59);
      
      const from = startOfDay.toISOString();
      const to = endOfDay.toISOString();
      
      // Use the actual backend endpoint
      const response = await apiClient.get<{ foodLogs: FoodLog[] }>(`/food-logs?userId=${userId || 2}&from=${from}&to=${to}&page=1&limit=50`);
      return response.data.foodLogs || [];
    } catch (error) {
      console.error('Failed to fetch today food logs:', error);
      throw error;
    }
  }

  /**
   * Get activities/exercises
   */
  async getActivities(search?: string, visibility?: string, page: number = 1, limit: number = 20): Promise<Activity[]> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      if (visibility) {
        params.append('visibility', visibility);
      }

      const response = await apiClient.get<ActivitiesResponse>(`/activities?${params.toString()}`);
      return response.data.items || [];
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(userId?: number, userGoals?: {
    calorieIntakeTarget?: number;
    calorieBurnTarget?: number;
    targetCarbs?: number;
    targetProtein?: number;
    targetFat?: number;
    targetWaterLitres?: number;
  }, options?: { summaryDate?: Date }): Promise<{
    stats: DashboardStats;
    recentMeals: Meal[];
    activityLogs: ActivityLog[];
    waterIntake: WaterIntake[];
    foodLogs: FoodLog[];
    sleepEntries: SleepEntry[];
    weightEntries: WeightEntry[];
    stepEntries: StepEntry[];
  }> {
    try {
      const summaryDay = options?.summaryDate ?? new Date();
      // Fetch real data from backend APIs
      let activityLogs: ActivityLog[] = [];
      let foodLogs: FoodLog[] = [];
      let waterIntake: WaterIntake[] = [];
      let sleepEntries: SleepEntry[] = [];
      let weightEntries: WeightEntry[] = [];
      let stepEntries: StepEntry[] = [];
      
      try {
        activityLogs = await this.getTodayActivityLogs(userId, summaryDay);
      } catch (activityError) {
        console.error('Activity logs failed, using empty array:', activityError);
        activityLogs = [];
      }
      
      try {
        foodLogs = await this.getTodayFoodLogs(userId, summaryDay);
      } catch (foodError) {
        console.error('Food logs failed, using empty array:', foodError);
        foodLogs = [];
      }
      
      try {
        waterIntake = await this.getTodayWaterIntake(userId, summaryDay);
      } catch (waterError) {
        console.error('Water intake failed, using empty array:', waterError);
        waterIntake = [];
      }
      
      try {
        sleepEntries = await this.getTodaySleepEntries(userId, summaryDay);
      } catch (sleepError) {
        console.error('Sleep entries failed, using empty array:', sleepError);
        sleepEntries = [];
      }
      
      try {
        weightEntries = await this.getTodayWeightEntries(userId, summaryDay);
      } catch (weightError) {
        console.error('Weight entries failed, using empty array:', weightError);
        weightEntries = [];
      }
      
      try {
        stepEntries = await this.getTodayStepEntries(userId, summaryDay);
      } catch (stepError) {
        console.error('Step entries failed, using empty array:', stepError);
        stepEntries = [];
      }
      
      // Calculate totals from real data
      const totalCalories = foodLogs.reduce((sum, food) => sum + food.calories, 0);
      const totalCarbs = foodLogs.reduce((sum, food) => sum + food.carbs, 0);
      const totalProtein = foodLogs.reduce((sum, food) => sum + food.protein, 0);
      const totalFat = foodLogs.reduce((sum, food) => sum + food.fat, 0);
      
      // Calculate water intake in ml
      const totalWaterMl = waterIntake.reduce((sum, water) => sum + water.amount, 0);
      
      // Calculate total calories burned from activity logs
      const totalCaloriesBurned = activityLogs.reduce((sum, activity) => sum + activity.caloriesBurned, 0);
      
      // Create stats with real data
      const stats: DashboardStats = {
        calories: { consumed: totalCalories, goal: userGoals?.calorieIntakeTarget || 2000 },
        macros: {
          carbs: { consumed: totalCarbs, goal: userGoals?.targetCarbs || 250 },
          protein: { consumed: totalProtein, goal: userGoals?.targetProtein || 120 },
          fat: { consumed: totalFat, goal: userGoals?.targetFat || 65 }
        },
        water: { consumed: totalWaterMl, goal: (userGoals?.targetWaterLitres || 2.5) * 1000 }, // Real water data in ml
        exercise: { burned: totalCaloriesBurned, goal: userGoals?.calorieBurnTarget || 400 } // Real calories burned from activity logs
      };

      // Convert food logs to recent meals format for display
      const recentMeals: Meal[] = foodLogs.map((food) => ({
        id: food.id.toString(),
        name: food.foodItemName,
        calories: food.calories,
        time: new Date(food.loggedAt).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        type: (food.mealType.charAt(0).toUpperCase() +
          food.mealType.slice(1)) as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
        foodCategory: food.food?.category,
      }));

      return {
        stats,
        recentMeals,
        activityLogs,
        waterIntake,
        foodLogs,
        sleepEntries,
        weightEntries,
        stepEntries,
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  }

  /**
   * Add new activity log
   */
  async addActivityLog(activityData: {
    activityName: string;
    caloriesBurned: number;
    duration: number;
    activityType: 'Cardio' | 'Strength' | 'Flexibility' | 'Sports' | 'Other';
  }): Promise<ActivityLog> {
    try {
      const response = await apiClient.post<ActivityLog>(`${this.baseUrl}/activities`, activityData);
      return response.data;
    } catch (error) {
      console.error('Failed to add activity log:', error);
      throw error;
    }
  }

  /**
   * Create a new activity
   */
  async createActivity(activityData: {
    name: string;
    category: string;
    caloriesPerMinute: number;
    visibility: 'PUBLIC' | 'PRIVATE';
  }): Promise<{ id: number; createdAt: string }> {
    try {
      console.log('=== CREATE ACTIVITY DEBUG ===');
      console.log('Creating activity:', activityData);
      console.log('============================');
      
      const response = await apiClient.post<{ id: number; createdAt: string }>('/activities', activityData);
      console.log('Activity created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create activity:', error);
      throw error;
    }
  }

  /**
   * Create new activity log entry
   */
  async createActivityLog(logData: {
    userId: number;
    activityId: number;
    loggedAt: string;
    durationMinutes: number;
    note: string;
  }): Promise<ActivityLog> {
    try {
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';
      console.log('=== CREATE ACTIVITY LOG DEBUG ===');
      console.log('Creating activity log:', logData);
      console.log('Endpoint: /activity-logs');
      console.log('Expected full URL:', `${apiBaseUrl}/activity-logs`);
      console.log('================================');
      const response = await apiClient.post<ActivityLog>('/activity-logs', logData);
      console.log('Activity log created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create activity log:', error);
      throw error;
    }
  }

  /**
   * Delete activity log by id (DELETE /activity-logs/{id})
   */
  async deleteActivityLog(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/activity-logs/${id}`);
      console.log('Activity log deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to delete activity log:', error);
      throw error;
    }
  }

  /**
   * Add water intake
   */
  async addWaterIntake(userId: number, amount: number, notes?: string): Promise<WaterIntake> {
    try {
      console.log('=== ADD WATER INTAKE API CALL ===');
      console.log('Adding water intake:', { userId, amount, notes });
      
      // Use /water endpoint (no /dashboard) to match steps, sleep, weight endpoints
      const response = await apiClient.post<WaterIntake>(`/water`, {
        userId,
        amount,
        note: notes || '',
        loggedAt: this.formatLocalDateTime(new Date()),
      });
      
      console.log('Water intake added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to add water intake:', error);
      throw error;
    }
  }

  /**
   * Update water intake by id.
   */
  async updateWaterIntake(
    id: number,
    waterData: { userId: number; amount: number; note?: string; loggedAt?: string }
  ): Promise<WaterIntake> {
    try {
      try {
        const patchResponse = await apiClient.patch<WaterIntake>(`/water/${id}`, waterData);
        return patchResponse.data;
      } catch {
        const putResponse = await apiClient.put<WaterIntake>(`/water/${id}`, waterData);
        return putResponse.data;
      }
    } catch (error) {
      console.error('Failed to update water intake:', error);
      throw error;
    }
  }

  /**
   * Delete water intake by id (DELETE /water/{id})
   */
  async deleteWaterIntake(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/water/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete water intake:', error);
      throw error;
    }
  }

  /**
   * Add water and automatically merge with today's existing intake.
   * This avoids backend 400 errors when only one entry per day is allowed.
   */
  async addOrAccumulateTodayWaterIntake(userId: number, amount: number, notes?: string): Promise<WaterIntake> {
    try {
      return await this.addWaterIntake(userId, amount, notes);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 400) {
        throw error;
      }

      const todaysEntries = await this.getTodayWaterIntake(userId);
      if (todaysEntries.length === 0) {
        throw error;
      }

      const totalExistingAmount = todaysEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
      const mergedAmount = totalExistingAmount + amount;
      const latestEntry = [...todaysEntries].sort(
        (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
      )[0];
      const mergedNote = [latestEntry.note, notes].filter(Boolean).join(' | ');

      try {
        return await this.updateWaterIntake(latestEntry.id, {
          userId,
          amount: mergedAmount,
          note: mergedNote,
          loggedAt: this.formatLocalDateTime(new Date()),
        });
      } catch (updateError) {
        await Promise.all(todaysEntries.map((entry) => this.deleteWaterIntake(entry.id)));
        return await this.addWaterIntake(userId, mergedAmount, mergedNote);
      }
    }
  }

  /**
   * Format date for LocalDateTime
   * Returns format: "YYYY-MM-DDTHH:mm:ssZ" (matching AddExerciseScreen format)
   */
  private formatLocalDateTime(date: Date): string {
    return date.toISOString().split('.')[0] + 'Z'; // Remove milliseconds but keep 'Z'
  }

  /**
   * Add sleep entry
   */
  async addSleepEntry(userId: number, hours: number, note?: string): Promise<SleepEntry> {
    try {
      console.log('=== ADD SLEEP ENTRY API CALL ===');
      console.log('Adding sleep entry:', { userId, hours, note });
      
      const response = await apiClient.post<SleepEntry>('/sleeps', {
        userId,
        hours,
        note: note || '',
        loggedAt: this.formatLocalDateTime(new Date()),
      });
      
      console.log('Sleep entry added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to add sleep entry:', error);
      throw error;
    }
  }

  /**
   * Add step entry
   */
  async addStepEntry(userId: number, stepCount: number, note?: string): Promise<StepEntry> {
    try {
      console.log('=== ADD STEP ENTRY API CALL ===');
      console.log('Adding step entry:', { userId, stepCount, note });
      
      const response = await apiClient.post<StepEntry>('/steps', {
        userId,
        stepCount,
        note: note || '',
        loggedAt: this.formatLocalDateTime(new Date()),
      });
      
      console.log('Step entry added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to add step entry:', error);
      throw error;
    }
  }

  /**
   * Add weight entry
   */
  async addWeightEntry(userId: number, weight: number, note?: string): Promise<WeightEntry> {
    try {
      console.log('=== ADD WEIGHT ENTRY API CALL ===');
      console.log('Adding weight entry:', { userId, weight, note });
      
      const response = await apiClient.post<WeightEntry>('/weights', {
        userId,
        weight,
        note: note || '',
        loggedAt: this.formatLocalDateTime(new Date()),
      });
      
      console.log('Weight entry added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to add weight entry:', error);
      throw error;
    }
  }

  /**
   * Delete weight entry by id (DELETE /weights/{id})
   */
  async deleteWeightEntry(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/weights/${id}`);
      console.log('Weight entry deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to delete weight entry:', error);
      throw error;
    }
  }

  /**
   * Replace today's weight entry with a new value.
   * Some backends enforce one weight log per day and return 400 for duplicates.
   */
  async addOrReplaceTodayWeightEntry(userId: number, weight: number, note?: string): Promise<WeightEntry> {
    try {
      const todaysEntries = await this.getTodayWeightEntries(userId);

      if (todaysEntries.length > 0) {
        await Promise.all(
          todaysEntries.map((entry) => this.deleteWeightEntry(entry.id))
        );
      }

      return await this.addWeightEntry(userId, weight, note);
    } catch (error) {
      console.error('Failed to replace today weight entry:', error);
      throw error;
    }
  }


  /**
   * Get user's daily goals
   */
  async getUserGoals(): Promise<{
    dailyCalorieIntakeTarget: number;
    dailyCalorieBurnTarget: number;
    dailyWaterTarget: number;
    macroTargets: {
      carbs: number;
      protein: number;
      fat: number;
    };
  }> {
    try {
      const response = await apiClient.get<{
        dailyCalorieIntakeTarget: number;
        dailyCalorieBurnTarget: number;
        dailyWaterTarget: number;
        macroTargets: {
          carbs: number;
          protein: number;
          fat: number;
        };
      }>(`${this.baseUrl}/goals`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user goals:', error);
      throw error;
    }
  }

  /**
   * Update user's daily goals
   */
  async updateUserGoals(goals: {
    dailyCalorieIntakeTarget?: number;
    dailyCalorieBurnTarget?: number;
    dailyWaterTarget?: number;
    macroTargets?: {
      carbs?: number;
      protein?: number;
      fat?: number;
    };
  }): Promise<void> {
    try {
      await apiClient.patch(`${this.baseUrl}/goals`, goals);
    } catch (error) {
      console.error('Failed to update user goals:', error);
      throw error;
    }
  }

  /**
   * Process voice log and create activity log entry
   */
  async processVoiceLog(voiceData: {
    userId: number;
    voiceText: string;
  }): Promise<{
    message: string;
    activityLog: {
      id: number;
      activity: string;
      durationMinutes: number;
      caloriesBurned: number;
      loggedAt: string;
      note: string;
    };
  }> {
    try {
      console.log('=== VOICE LOG API CALL ===');
      console.log('Processing voice log:', voiceData);
      console.log('==========================');

      const lengthError = validateActivityVoiceTextLength(voiceData.voiceText);
      if (lengthError) {
        throw new Error(lengthError);
      }

      // Use only the fields that backend expects: userId and voiceText
      const requestData = {
        userId: voiceData.userId,
        voiceText: voiceData.voiceText.trim(),
      };
      
      const response = await apiClient.post<{
        message: string;
        activityLog: {
          id: number;
          activity: string;
          durationMinutes: number;
          caloriesBurned: number;
          loggedAt: string;
          note: string;
        };
      }>('/ai/activity-log/from-voice', requestData);
      
      // Fix the loggedAt date if it's incorrect
      const responseData = response.data;
      if (responseData.activityLog.loggedAt && responseData.activityLog.loggedAt.includes('2023')) {
        console.log('Fixing incorrect loggedAt date from backend');
        responseData.activityLog.loggedAt = new Date().toISOString();
      }
      
      console.log('Voice log processed successfully:', responseData);
      return responseData;
    } catch (error) {
      console.error('Failed to process voice log:', error);
      throw error;
    }
  }

  /**
   * Get foods with search and pagination
   */
  async getFoods(params: {
    search?: string;
    visibility?: 'public' | 'private';
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'calories' | 'createdAt';
    sortDir?: 'asc' | 'desc';
  } = {}): Promise<FoodsResponse> {
    try {
      console.log('=== FOODS API CALL ===');
      console.log('Fetching foods with params:', params);
      console.log('========================');

      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.visibility) queryParams.append('visibility', params.visibility);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortDir) queryParams.append('sortDir', params.sortDir);

      const url = `/foods${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await apiClient.get<FoodsResponse>(url);
      
      console.log('Foods fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch foods:', error);
      throw error;
    }
  }

  /**
   * Get popular foods (public foods with default sorting)
   */
  async getPopularFoods(limit: number = 10): Promise<FoodItem[]> {
    try {
      const response = await this.getFoods({
        page: 1,
        limit,
        sortBy: 'name',
        sortDir: 'asc'
      });
      
      return response.foodItems;
    } catch (error) {
      console.error('Failed to fetch popular foods:', error);
      throw error;
    }
  }

  /**
   * Search foods by name
   */
  async searchFoods(query: string, limit: number = 10): Promise<FoodItem[]> {
    try {
      if (!query.trim()) {
        return this.getPopularFoods(limit);
      }

      const response = await this.getFoods({
        search: query,
        page: 1,
        limit,
        sortBy: 'name',
        sortDir: 'asc'
      });
      
      return response.foodItems;
    } catch (error) {
      console.error('Failed to search foods:', error);
      throw error;
    }
  }

  /**
   * Get food logs with filtering and pagination
   */
  async getFoodLogs(params: {
    userId?: number;
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<FoodLogsResponse> {
    try {
      console.log('=== FOOD LOGS API CALL ===');
      console.log('Fetching food logs with params:', params);
      console.log('========================');

      const queryParams = new URLSearchParams();
      
      if (params.userId) queryParams.append('userId', params.userId.toString());
      if (params.mealType) queryParams.append('mealType', params.mealType);
      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const url = `/food-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await apiClient.get<FoodLogsResponse>(url);
      
      console.log('Food logs fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch food logs:', error);
      throw error;
    }
  }

  /**
   * Get food logs for a calendar day (local device interpretation), grouped by meal type
   */
  async getTodaysFoodLogs(userId: number, day?: Date): Promise<Record<string, FoodLog[]>> {
    try {
      const ref = day ?? new Date();
      const startOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0);
      const endOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59);
      
      const from = startOfDay.toISOString();
      const to = endOfDay.toISOString();
      
      console.log(`Fetching food logs for day: ${from} to ${to}`);
      
      // Use the endpoint with date filtering
      const response = await apiClient.get<FoodLogsResponse>(`/food-logs?userId=${userId}&from=${from}&to=${to}&page=1&limit=50`);

      // Group food logs by meal type
      const groupedLogs: Record<string, FoodLog[]> = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: []
      };

      response.data.foodLogs.forEach(log => {
        if (log.mealType && groupedLogs[log.mealType]) {
          groupedLogs[log.mealType].push(log);
        }
      });

      console.log('Today\'s food logs grouped:', groupedLogs);
      return groupedLogs;
    } catch (error) {
      console.error('Failed to fetch today\'s food logs:', error);
      throw error;
    }
  }

  /**
   * Add food log entry
   */
  async addFoodLog(foodLogData: {
    userId: number;
    foodItemId: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    quantity: number;
    unit?: string;
    note?: string;
    loggedAt?: string;
  }): Promise<{
    id: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    createdAt: string;
  }> {
    try {
      console.log('=== ADD FOOD LOG API CALL ===');
      console.log('Adding food log:', foodLogData);
      console.log('============================');

      const requestData = {
        userId: foodLogData.userId,
        foodItemId: foodLogData.foodItemId,
        loggedAt: foodLogData.loggedAt || new Date().toISOString().slice(0, 19) + 'Z',
        mealType: foodLogData.mealType,
        quantity: foodLogData.quantity,
        unit: foodLogData.unit || 'grams',
        note: foodLogData.note || ''
      };

      const response = await apiClient.post<{
        id: number;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
        createdAt: string;
      }>('/food-logs', requestData);
      
      console.log('Food log added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to add food log:', error);
      throw error;
    }
  }

  /**
   * Delete food log by id (DELETE /food-logs/{id})
   */
  async deleteFoodLog(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/food-logs/${id}`);
      console.log('Food log deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to delete food log:', error);
      throw error;
    }
  }

  /**
   * Process voice log and create food log entries
   */
  async processFoodVoiceLog(voiceData: {
    userId: number;
    voiceText: string;
  }): Promise<VoiceFoodLogResponse> {
    try {
      console.log('=== FOOD VOICE LOG API CALL ===');
      console.log('Processing food voice log:', voiceData);
      console.log('==============================');

      const trimmed = voiceData.voiceText?.trim() ?? '';
      if (!trimmed) {
        throw new Error('Please describe what you ate.');
      }

      const requestData = {
        userId: voiceData.userId,
        voiceText: trimmed,
      };

      const response = await apiClient.post<VoiceFoodLogResponse>('/ai/food-log/from-voice', requestData);
      
      console.log('Food voice log processed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to process food voice log:', error);
      throw error;
    }
  }

  /**
   * Create a new food item
   */
  async createFood(foodData: {
    name: string;
    category?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    defaultUnit?: string;
    quantityPerUnit?: number;
    caloriesPerUnit: number;
    proteinPerUnit?: number;
    carbsPerUnit?: number;
    fatPerUnit?: number;
    fiberPerUnit?: number;
    visibility?: 'public' | 'private';
  }): Promise<{
    id: number;
    name: string;
    category: string;
    defaultUnit: string;
    quantityPerUnit: number;
    caloriesPerUnit: number;
    proteinPerUnit: number;
    carbsPerUnit: number;
    fatPerUnit: number;
    fiberPerUnit: number;
    visibility: string;
    createdAt: string;
    updatedAt: string;
  }> {
    try {
      console.log('=== CREATE FOOD API CALL ===');
      console.log('Creating food:', foodData);
      console.log('============================');
      
      const requestData = {
        name: foodData.name.trim(),
        category: foodData.category || 'snack',
        defaultUnit: foodData.defaultUnit || 'grams',
        quantityPerUnit: foodData.quantityPerUnit || 100,
        caloriesPerUnit: foodData.caloriesPerUnit,
        proteinPerUnit: foodData.proteinPerUnit || 0,
        carbsPerUnit: foodData.carbsPerUnit || 0,
        fatPerUnit: foodData.fatPerUnit || 0,
        fiberPerUnit: foodData.fiberPerUnit || 0,
        visibility: foodData.visibility || 'public'
      };
      
      const response = await apiClient.post<{
        id: number;
        name: string;
        category: string;
        defaultUnit: string;
        quantityPerUnit: number;
        caloriesPerUnit: number;
        proteinPerUnit: number;
        carbsPerUnit: number;
        fatPerUnit: number;
        fiberPerUnit: number;
        visibility: string;
        createdAt: string;
        updatedAt: string;
      }>('/foods', requestData);
      
      console.log('Food created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create food:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const dashboardApiService = new DashboardApiService();
