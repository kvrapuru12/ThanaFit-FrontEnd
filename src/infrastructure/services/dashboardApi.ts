import { apiClient } from '../api/ApiClient';

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
   * Get appropriate food image based on food name
   */
  private getFoodImage(foodName: string): string {
    const foodImages: { [key: string]: string } = {
      'chicken breast': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlja2VuJTIwYnJlYXN0fGVufDF8fHx8MTc1NzUzMDI2OXww&ixlib=rb-4.1.0&q=80&w=300',
      'chicken': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlja2VuJTIwYnJlYXN0fGVufDF8fHx8MTc1NzUzMDI2OXww&ixlib=rb-4.1.0&q=80&w=300',
      'oatmeal': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvYXRtZWFsfGVufDF8fHx8MTc1NzUzMDI2OXww&ixlib=rb-4.1.0&q=80&w=300',
      'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5hbmF8ZW58MXx8fHwxNzU3NTMwMjY5fDA&ixlib=rb-4.1.0&q=80&w=300',
      'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm93biUyMHJpY2V8ZW58MXx8fHwxNzU3NTMwMjY5fDA&ixlib=rb-4.1.0&q=80&w=300',
      'brown rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm93biUyMHJpY2V8ZW58MXx8fHwxNzU3NTMwMjY5fDA&ixlib=rb-4.1.0&q=80&w=300',
      'salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxtb258ZW58MXx8fHwxNzU3NTMwMjY5fDA&ixlib=rb-4.1.0&q=80&w=300',
      'eggs': 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZ2dzfGVufDF8fHx8MTc1NzUzMDI2OXww&ixlib=rb-4.1.0&q=80&w=300',
      'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmVhZHxlbnwxfHx8fDE3NTc1MzAyNjl8MA&ixlib=rb-4.1.0&q=80&w=300',
      'avocado': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdm9jYWRvfGVufDF8fHx8MTc1NzUzMDI2OXww&ixlib=rb-4.1.0&q=80&w=300',
      'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsZXxlbnwxfHx8fDE3NTc1MzAyNjl8MA&ixlib=rb-4.1.0&q=80&w=300',
      'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxhZHxlbnwxfHx8fDE3NTc1MzAyNjl8MA&ixlib=rb-4.1.0&q=80&w=300',
      'pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YXxlbnwxfHx8fDE3NTc1MzAyNjl8MA&ixlib=rb-4.1.0&q=80&w=300',
      'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YXxlbnwxfHx8fDE3NTc1MzAyNjl8MA&ixlib=rb-4.1.0&q=80&w=300',
      'yogurt': 'https://images.unsplash.com/photo-1571212515410-3b4a54d21592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHl5b2d1cnR8ZW58MXx8fHwxNzU3NTMwMjY5fDA&ixlib=rb-4.1.0&q=80&w=300',
      'milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWxrfGVufDF8fHx8MTc1NzUzMDI2OXww&ixlib=rb-4.1.0&q=80&w=300',
      'cheese': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVlc2V8ZW58MXx8fHwxNzU3NTMwMjY5fDA&ixlib=rb-4.1.0&q=80&w=300',
      'nuts': 'https://images.unsplash.com/photo-1551782450-17144efb9c50?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxudXRzfGVufDF8fHx8MTc1NzUzMDI2OXww&ixlib=rb-4.1.0&q=80&w=300',
      'almonds': 'https://images.unsplash.com/photo-1551782450-17144efb9c50?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxudXRzfGVufDF8fHx8MTc1NzUzMDI2OXww&ixlib=rb-4.1.0&q=80&w=300'
    };

    // Try to find exact match first
    const exactMatch = foodImages[foodName.toLowerCase()];
    if (exactMatch) {
      return exactMatch;
    }

    // Try to find partial match
    for (const [key, imageUrl] of Object.entries(foodImages)) {
      if (foodName.toLowerCase().includes(key) || key.includes(foodName.toLowerCase())) {
        return imageUrl;
      }
    }

    // Default healthy food image
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZHxlbnwxfHx8fDE3NTc1MzAyNjl8MA&ixlib=rb-4.1.0&q=80&w=300';
  }

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
  async getTodayActivityLogs(userId?: number): Promise<ActivityLog[]> {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
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
  async getTodayWaterIntake(userId?: number): Promise<WaterIntake[]> {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
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
  async getTodaySleepEntries(userId?: number): Promise<SleepEntry[]> {
    try {
      // Get today's date range dynamically
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
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
  async getTodayWeightEntries(userId?: number): Promise<WeightEntry[]> {
    try {
      // Get today's date range dynamically
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
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
  async getTodayStepEntries(userId?: number): Promise<StepEntry[]> {
    try {
      // Get today's date range dynamically
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
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
  async getTodayFoodLogs(userId?: number): Promise<FoodLog[]> {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
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
  async getDashboardData(userId?: number, userGoals?: { calorieIntakeTarget?: number; calorieBurnTarget?: number }): Promise<{
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
      // Fetch real data from backend APIs
      let activityLogs: ActivityLog[] = [];
      let foodLogs: FoodLog[] = [];
      let waterIntake: WaterIntake[] = [];
      let sleepEntries: SleepEntry[] = [];
      let weightEntries: WeightEntry[] = [];
      let stepEntries: StepEntry[] = [];
      
      try {
        activityLogs = await this.getTodayActivityLogs(userId);
      } catch (activityError) {
        console.error('Activity logs failed, using empty array:', activityError);
        activityLogs = [];
      }
      
      try {
        foodLogs = await this.getTodayFoodLogs(userId);
      } catch (foodError) {
        console.error('Food logs failed, using empty array:', foodError);
        foodLogs = [];
      }
      
      try {
        waterIntake = await this.getTodayWaterIntake(userId);
      } catch (waterError) {
        console.error('Water intake failed, using empty array:', waterError);
        waterIntake = [];
      }
      
      try {
        sleepEntries = await this.getTodaySleepEntries(userId);
      } catch (sleepError) {
        console.error('Sleep entries failed, using empty array:', sleepError);
        sleepEntries = [];
      }
      
      try {
        weightEntries = await this.getTodayWeightEntries(userId);
      } catch (weightError) {
        console.error('Weight entries failed, using empty array:', weightError);
        weightEntries = [];
      }
      
      try {
        stepEntries = await this.getTodayStepEntries(userId);
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
          carbs: { consumed: totalCarbs, goal: 250 },
          protein: { consumed: totalProtein, goal: 120 },
          fat: { consumed: totalFat, goal: 65 }
        },
        water: { consumed: totalWaterMl, goal: 2000 }, // Real water data in ml (2L goal)
        exercise: { burned: totalCaloriesBurned, goal: userGoals?.calorieBurnTarget || 400 } // Real calories burned from activity logs
      };

      // Convert food logs to recent meals format for display
      const recentMeals: Meal[] = foodLogs.map(food => ({
        id: food.id.toString(),
        name: food.foodItemName,
        calories: food.calories,
        time: new Date(food.loggedAt).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        type: (food.mealType.charAt(0).toUpperCase() + food.mealType.slice(1)) as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
        image: this.getFoodImage(food.foodItemName)
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
      console.log('=== CREATE ACTIVITY LOG DEBUG ===');
      console.log('Creating activity log:', logData);
      console.log('Endpoint: /activity-logs');
      console.log('Expected full URL: http://192.168.4.219:8080/api/activity-logs');
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
   * Add water intake
   */
  async addWaterIntake(amount: number, notes?: string): Promise<WaterIntake> {
    try {
      const response = await apiClient.post<WaterIntake>(`${this.baseUrl}/water`, {
        amount,
        notes,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to add water intake:', error);
      throw error;
    }
  }

  /**
   * Add food log
   */
  async addFoodLog(foodData: {
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
  }): Promise<FoodLog> {
    try {
      const response = await apiClient.post<FoodLog>(`${this.baseUrl}/food`, foodData);
      return response.data;
    } catch (error) {
      console.error('Failed to add food log:', error);
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
      
      // Use only the fields that backend expects: userId and voiceText
      const requestData = {
        userId: voiceData.userId,
        voiceText: voiceData.voiceText
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
}

// Create and export singleton instance
export const dashboardApiService = new DashboardApiService();
