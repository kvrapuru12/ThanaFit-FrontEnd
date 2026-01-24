import { apiClient } from '../api/ApiClient';
import { dashboardApiService, FoodLog, ActivityLog, WaterIntake, WeightEntry } from './dashboardApi';

// Progress Data Types
export interface WeeklyDataPoint {
  day: string; // 'Mon', 'Tue', etc.
  date: string; // ISO date (YYYY-MM-DD)
  calories: number;
  exercise: number; // calories burned
  exerciseMinutes: number; // duration in minutes
  weight: number | null;
  water: number; // in ml
  waterGlasses: number; // converted to glasses (assuming 250ml per glass)
}

export interface GoalStats {
  calories: { current: number; goal: number; percentage: number };
  exercise: { current: number; goal: number; percentage: number };
  weight: { current: number | null; goal: number | null; percentage: number };
  water: { current: number; goal: number; percentage: number };
}

export interface MacroDistribution {
  carbs: { value: number; percentage: number };
  protein: { value: number; percentage: number };
  fat: { value: number; percentage: number };
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number; // 0-100
}

// Progress API Service
export class ProgressApiService {
  /**
   * Get day name abbreviation (Mon, Tue, etc.)
   */
  private getDayName(date: Date): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get start and end of day in ISO format
   */
  private getDayRange(date: Date): { from: string; to: string } {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return {
      from: startOfDay.toISOString(),
      to: endOfDay.toISOString(),
    };
  }

  /**
   * Get weekly aggregated data (last 7 days)
   */
  async getWeeklyData(userId: number): Promise<WeeklyDataPoint[]> {
    try {
      console.log('=== GET WEEKLY DATA ===');
      console.log('Fetching weekly data for userId:', userId);

      // Get last 7 days (including today)
      const today = new Date();
      const days: WeeklyDataPoint[] = [];

      // Fetch data for each of the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayRange = this.getDayRange(date);

        console.log(`Fetching data for ${this.formatDate(date)}`);

        // Initialize day data
        const dayData: WeeklyDataPoint = {
          day: this.getDayName(date),
          date: this.formatDate(date),
          calories: 0,
          exercise: 0,
          exerciseMinutes: 0,
          weight: null,
          water: 0,
          waterGlasses: 0,
        };

        try {
          // Fetch food logs for this day
          const foodLogsResponse = await apiClient.get<{ foodLogs: FoodLog[] }>(
            `/food-logs?userId=${userId}&from=${dayRange.from}&to=${dayRange.to}&page=1&limit=100`
          );
          const foodLogs = foodLogsResponse.data.foodLogs || [];
          dayData.calories = foodLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
          console.log(`  Calories: ${dayData.calories} from ${foodLogs.length} food logs`);
        } catch (error) {
          console.warn(`Failed to fetch food logs for ${this.formatDate(date)}:`, error);
        }

        try {
          // Fetch activity logs for this day
          const activityLogsResponse = await apiClient.get<{ items: ActivityLog[] }>(
            `/activity-logs?userId=${userId}&from=${dayRange.from}&to=${dayRange.to}&page=1&limit=100&sortBy=loggedAt&sortDir=desc`
          );
          const activityLogs = activityLogsResponse.data.items || [];
          dayData.exercise = activityLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
          dayData.exerciseMinutes = activityLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
          console.log(`  Exercise: ${dayData.exercise} cal, ${dayData.exerciseMinutes} min from ${activityLogs.length} logs`);
        } catch (error) {
          console.warn(`Failed to fetch activity logs for ${this.formatDate(date)}:`, error);
        }

        try {
          // Fetch water intake for this day
          const waterResponse = await apiClient.get<{ items: WaterIntake[] }>(
            `/water?userId=${userId}&from=${dayRange.from}&to=${dayRange.to}&page=1&limit=100`
          );
          const waterIntake = waterResponse.data.items || [];
          dayData.water = waterIntake.reduce((sum, water) => sum + (water.amount || 0), 0);
          dayData.waterGlasses = Math.round(dayData.water / 250); // Convert ml to glasses (250ml per glass)
          console.log(`  Water: ${dayData.water} ml (${dayData.waterGlasses} glasses) from ${waterIntake.length} entries`);
        } catch (error) {
          console.warn(`Failed to fetch water intake for ${this.formatDate(date)}:`, error);
        }

        try {
          // Fetch weight entries for this day (get the most recent one)
          const weightResponse = await apiClient.get<{ items: WeightEntry[] }>(
            `/weights?userId=${userId}&from=${dayRange.from}&to=${dayRange.to}&page=1&limit=1&sortBy=loggedAt&sortDir=desc`
          );
          const weightEntries = weightResponse.data.items || [];
          if (weightEntries.length > 0) {
            const weightEntry = weightEntries[0];
            dayData.weight = weightEntry.weight || weightEntry.weightKg || weightEntry.weightValue || null;
            console.log(`  Weight: ${dayData.weight} kg`);
          }
        } catch (error) {
          console.warn(`Failed to fetch weight for ${this.formatDate(date)}:`, error);
        }

        days.push(dayData);
      }

      console.log('Weekly data fetched successfully:', days);
      return days;
    } catch (error) {
      console.error('Failed to fetch weekly data:', error);
      throw error;
    }
  }

  /**
   * Get goal stats (current vs goals) for today
   */
  async getGoalStats(
    userId: number,
    userGoals: {
      calorieIntakeTarget?: number;
      calorieBurnTarget?: number;
      targetWeight?: number;
      targetWater?: number; // in ml
    }
  ): Promise<GoalStats> {
    try {
      console.log('=== GET GOAL STATS ===');
      console.log('User goals:', userGoals);

      // Get today's data using dashboardApiService
      const dashboardData = await dashboardApiService.getDashboardData(userId, {
        calorieIntakeTarget: userGoals.calorieIntakeTarget,
        calorieBurnTarget: userGoals.calorieBurnTarget,
      });

      // Calculate current values
      const currentCalories = dashboardData.stats.calories.consumed;
      const currentExercise = dashboardData.stats.exercise.burned;
      const currentWater = dashboardData.stats.water.consumed; // in ml

      // Get most recent weight
      let currentWeight: number | null = null;
      if (dashboardData.weightEntries.length > 0) {
        const latestWeight = dashboardData.weightEntries[0];
        currentWeight = latestWeight.weight || latestWeight.weightKg || latestWeight.weightValue || null;
      }

      // Calculate percentages
      const caloriesPercentage = userGoals.calorieIntakeTarget
        ? Math.min(100, Math.round((currentCalories / userGoals.calorieIntakeTarget) * 100))
        : 0;

      const exercisePercentage = userGoals.calorieBurnTarget
        ? Math.min(100, Math.round((currentExercise / userGoals.calorieBurnTarget) * 100))
        : 0;

      const weightPercentage = userGoals.targetWeight && currentWeight
        ? Math.min(100, Math.round(((userGoals.targetWeight - currentWeight) / userGoals.targetWeight) * 100))
        : 0;

      const waterGoal = userGoals.targetWater || 2000; // Default 2L
      const waterPercentage = Math.min(100, Math.round((currentWater / waterGoal) * 100));

      const goalStats: GoalStats = {
        calories: {
          current: currentCalories,
          goal: userGoals.calorieIntakeTarget || 2000,
          percentage: caloriesPercentage,
        },
        exercise: {
          current: currentExercise,
          goal: userGoals.calorieBurnTarget || 400,
          percentage: exercisePercentage,
        },
        weight: {
          current: currentWeight,
          goal: userGoals.targetWeight || null,
          percentage: weightPercentage,
        },
        water: {
          current: Math.round(currentWater / 250), // Convert to glasses
          goal: Math.round(waterGoal / 250), // Convert to glasses
          percentage: waterPercentage,
        },
      };

      console.log('Goal stats calculated:', goalStats);
      return goalStats;
    } catch (error) {
      console.error('Failed to fetch goal stats:', error);
      throw error;
    }
  }

  /**
   * Get macro distribution for a date range (default: today)
   */
  async getMacroDistribution(
    userId: number,
    from?: string,
    to?: string
  ): Promise<MacroDistribution> {
    try {
      console.log('=== GET MACRO DISTRIBUTION ===');

      // If no date range provided, use today
      if (!from || !to) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        from = startOfDay.toISOString();
        to = endOfDay.toISOString();
      }

      // Fetch food logs for the date range
      const foodLogsResponse = await apiClient.get<{ foodLogs: FoodLog[] }>(
        `/food-logs?userId=${userId}&from=${from}&to=${to}&page=1&limit=100`
      );
      const foodLogs = foodLogsResponse.data.foodLogs || [];

      // Aggregate macros
      const totalCarbs = foodLogs.reduce((sum, log) => sum + (log.carbs || 0), 0);
      const totalProtein = foodLogs.reduce((sum, log) => sum + (log.protein || 0), 0);
      const totalFat = foodLogs.reduce((sum, log) => sum + (log.fat || 0), 0);

      const totalMacros = totalCarbs + totalProtein + totalFat;

      // Calculate percentages
      const carbsPercentage = totalMacros > 0 ? Math.round((totalCarbs / totalMacros) * 100) : 0;
      const proteinPercentage = totalMacros > 0 ? Math.round((totalProtein / totalMacros) * 100) : 0;
      const fatPercentage = totalMacros > 0 ? Math.round((totalFat / totalMacros) * 100) : 0;

      const macroDistribution: MacroDistribution = {
        carbs: {
          value: totalCarbs,
          percentage: carbsPercentage,
        },
        protein: {
          value: totalProtein,
          percentage: proteinPercentage,
        },
        fat: {
          value: totalFat,
          percentage: fatPercentage,
        },
      };

      console.log('Macro distribution calculated:', macroDistribution);
      return macroDistribution;
    } catch (error) {
      console.error('Failed to fetch macro distribution:', error);
      throw error;
    }
  }

  /**
   * Get user achievements (calculated from historical data)
   */
  async getAchievements(userId: number): Promise<Achievement[]> {
    try {
      console.log('=== GET ACHIEVEMENTS ===');

      const achievements: Achievement[] = [];

      // Get last 7 days of data
      const weeklyData = await this.getWeeklyData(userId);

      // Achievement 1: 7-Day Streak
      const hasSevenDayStreak = weeklyData.length === 7 && weeklyData.every(day => 
        day.calories > 0 || day.exercise > 0
      );
      achievements.push({
        id: 1,
        title: '7-Day Streak',
        description: 'Consistent logging',
        icon: 'emoji-events',
        earned: hasSevenDayStreak,
        progress: hasSevenDayStreak ? 100 : Math.round((weeklyData.filter(d => d.calories > 0 || d.exercise > 0).length / 7) * 100),
      });

      // Achievement 2: Calorie Master (met daily goals 5 times)
      const dashboardData = await dashboardApiService.getDashboardData(userId);
      const calorieGoal = dashboardData.stats.calories.goal;
      const calorieMasterCount = weeklyData.filter(day => day.calories >= calorieGoal).length;
      achievements.push({
        id: 2,
        title: 'Calorie Master',
        description: 'Met daily goals 5 times',
        icon: 'gps-fixed',
        earned: calorieMasterCount >= 5,
        progress: Math.min(100, Math.round((calorieMasterCount / 5) * 100)),
      });

      // Achievement 3: Exercise Warrior (completed 10 workouts)
      const totalWorkouts = weeklyData.reduce((sum, day) => {
        // Count days with exercise
        return sum + (day.exercise > 0 ? 1 : 0);
      }, 0);
      achievements.push({
        id: 3,
        title: 'Exercise Warrior',
        description: 'Completed 10 workouts',
        icon: 'fitness-center',
        earned: totalWorkouts >= 10,
        progress: Math.min(100, Math.round((totalWorkouts / 10) * 100)),
      });

      // Achievement 4: Hydration Hero (drank 8 glasses daily)
      const hydrationHeroCount = weeklyData.filter(day => day.waterGlasses >= 8).length;
      achievements.push({
        id: 4,
        title: 'Hydration Hero',
        description: 'Drank 8 glasses daily',
        icon: 'water-drop',
        earned: hydrationHeroCount >= 7,
        progress: Math.min(100, Math.round((hydrationHeroCount / 7) * 100)),
      });

      console.log('Achievements calculated:', achievements);
      return achievements;
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      // Return default achievements on error
      return [
        { id: 1, title: '7-Day Streak', description: 'Consistent logging', icon: 'emoji-events', earned: false, progress: 0 },
        { id: 2, title: 'Calorie Master', description: 'Met daily goals 5 times', icon: 'gps-fixed', earned: false, progress: 0 },
        { id: 3, title: 'Exercise Warrior', description: 'Completed 10 workouts', icon: 'fitness-center', earned: false, progress: 0 },
        { id: 4, title: 'Hydration Hero', description: 'Drank 8 glasses daily', icon: 'water-drop', earned: false, progress: 0 },
      ];
    }
  }
}

// Create and export singleton instance
export const progressApiService = new ProgressApiService();
