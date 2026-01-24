# Progress Tab Backend Integration Plan

## 📊 Current Status Analysis

### ✅ **Already Integrated Backend Endpoints**

#### Authentication & User
- `POST /auth/login` - User login
- `POST /auth/google` - Google Sign-In
- `POST /auth/signup` - User registration
- `POST /auth/logout` - User logout
- `GET /users/{userId}` - Get user profile
- `PATCH /users/{userId}` - Update user profile

#### Today's Data (Dashboard)
- `GET /activity-logs?userId={id}&from={date}&to={date}` - Today's activity logs
- `GET /food-logs?userId={id}&from={date}&to={date}` - Today's food logs
- `GET /water?userId={id}&from={date}&to={date}` - Today's water intake
- `GET /sleeps?userId={id}&from={date}&to={date}` - Today's sleep entries
- `GET /weights?userId={id}&from={date}&to={date}` - Today's weight entries
- `GET /steps?userId={id}&from={date}&to={date}` - Today's step entries
- `GET /activities` - List of available activities
- `POST /activity-logs` - Create activity log
- `POST /food-logs` - Create food log
- `POST /water` - Add water intake

#### Cycle Sync
- `GET /cycles?userId={id}` - Get user cycles
- `POST /cycles` - Create cycle
- `PATCH /cycles/{id}` - Update cycle
- `GET /ai/suggestions/cycle-sync/food` - Food recommendations
- `GET /ai/suggestions/cycle-sync/activity` - Activity recommendations

---

## ❌ **Missing for Progress Tab**

### 1. **Weekly Historical Data** (CRITICAL)
**What Progress Tab Needs:**
- Weekly calories consumed (last 7 days)
- Weekly exercise minutes/calories burned (last 7 days)
- Weekly weight tracking (last 7 days)
- Weekly water intake (last 7 days)

**Current Status:** Using hardcoded data in `ProgressTracking.tsx`

**Backend Endpoints Needed:**
- Option A: Use existing endpoints with date range (last 7 days)
  - ✅ `GET /food-logs?userId={id}&from={7daysAgo}&to={today}` - Can aggregate calories
  - ✅ `GET /activity-logs?userId={id}&from={7daysAgo}&to={today}` - Can aggregate exercise
  - ✅ `GET /weights?userId={id}&from={7daysAgo}&to={today}` - Can get weight data
  - ✅ `GET /water?userId={id}&from={7daysAgo}&to={today}` - Can aggregate water

- Option B: New aggregated endpoint (if backend provides)
  - `GET /progress/weekly?userId={id}` - Returns weekly aggregated data

**Decision:** Use Option A (existing endpoints) - No new backend endpoint needed!

---

### 2. **Goal Stats Calculation** (MEDIUM)
**What Progress Tab Needs:**
- Current vs Goal for: Calories, Exercise, Weight, Water

**Current Status:** Using hardcoded values

**Data Available:**
- ✅ User goals: `user.dailyCalorieIntakeTarget`, `user.dailyCalorieBurnTarget`
- ✅ Today's actual: From `dashboardApi.getDashboardData()`
- ❌ Weight goal: Not in User entity (need to check if exists or use `targetWeight`)

**Backend Endpoints Needed:**
- None! Can calculate from existing data

---

### 3. **Macro Distribution Chart** (MEDIUM)
**What Progress Tab Needs:**
- Percentage breakdown: Carbs %, Protein %, Fat %

**Current Status:** Using hardcoded percentages (45%, 30%, 25%)

**Data Available:**
- ✅ Today's macros: From `foodLogs` (carbs, protein, fat)
- ✅ Can calculate percentages from total macros

**Backend Endpoints Needed:**
- None! Can calculate from existing `foodLogs` data

---

### 4. **Achievements** (LOW PRIORITY)
**What Progress Tab Needs:**
- List of achievements with earned status
- Examples: "7-Day Streak", "Calorie Master", "Exercise Warrior", "Hydration Hero"

**Current Status:** Using hardcoded achievements

**Backend Endpoints Needed:**
- Option A: Calculate from user data (no backend endpoint)
  - Check streak from activity/food logs
  - Check goal completion count
  - Check workout count
  
- Option B: New backend endpoint (if backend provides)
  - `GET /achievements?userId={id}` - Returns user achievements

**Decision:** Start with Option A (calculate from data), add Option B later if needed

---

## 🎯 Implementation Plan

### **Phase 1: Weekly Data Integration** (Priority 1)
**Steps:**
1. Create `ProgressApiService` in `src/infrastructure/services/progressApi.ts`
2. Add method: `getWeeklyData(userId, startDate, endDate)` 
   - Aggregates data from existing endpoints
   - Returns: `{ dailyData: [{ day, calories, exercise, weight, water }] }`
3. Create `useProgressData` hook in `src/presentation/hooks/useProgressData.ts`
4. Update `ProgressTracking.tsx` to use real weekly data

**Files to Create:**
- `src/infrastructure/services/progressApi.ts`
- `src/presentation/hooks/useProgressData.ts`

**Files to Modify:**
- `src/presentation/components/ProgressTracking.tsx`

---

### **Phase 2: Goal Stats Integration** (Priority 2)
**Steps:**
1. Add method to `ProgressApiService`: `getGoalStats(userId)`
   - Uses `dashboardApi.getDashboardData()` for today's actuals
   - Uses `user` entity for goals
   - Calculates progress percentages
2. Update `ProgressTracking.tsx` to use calculated goal stats

**Files to Modify:**
- `src/infrastructure/services/progressApi.ts`
- `src/presentation/components/ProgressTracking.tsx`

---

### **Phase 3: Macro Distribution** (Priority 3)
**Steps:**
1. Add method to `ProgressApiService`: `getMacroDistribution(userId, dateRange)`
   - Aggregates carbs, protein, fat from food logs
   - Calculates percentages
2. Update `ProgressTracking.tsx` to use real macro data

**Files to Modify:**
- `src/infrastructure/services/progressApi.ts`
- `src/presentation/components/ProgressTracking.tsx`

---

### **Phase 4: Achievements** (Priority 4)
**Steps:**
1. Add method to `ProgressApiService`: `getAchievements(userId)`
   - Calculates achievements from historical data
   - Checks streaks, goal completions, workout counts
2. Update `ProgressTracking.tsx` to use calculated achievements

**Files to Modify:**
- `src/infrastructure/services/progressApi.ts`
- `src/presentation/components/ProgressTracking.tsx`

---

## 📝 Detailed Implementation Steps

### Step 1: Create ProgressApiService

```typescript
// src/infrastructure/services/progressApi.ts
import { apiClient } from '../api/ApiClient';
import { dashboardApiService } from './dashboardApi';

export interface WeeklyDataPoint {
  day: string; // 'Mon', 'Tue', etc.
  date: string; // ISO date
  calories: number;
  exercise: number; // minutes or calories burned
  weight: number | null;
  water: number; // ml or glasses
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

export class ProgressApiService {
  /**
   * Get weekly aggregated data (last 7 days)
   */
  async getWeeklyData(userId: number): Promise<WeeklyDataPoint[]> {
    // Implementation: Fetch last 7 days of data and aggregate by day
  }

  /**
   * Get goal stats (current vs goals)
   */
  async getGoalStats(userId: number, userGoals: {
    calorieIntakeTarget?: number;
    calorieBurnTarget?: number;
    targetWeight?: number;
    targetWater?: number;
  }): Promise<GoalStats> {
    // Implementation: Get today's data and compare with goals
  }

  /**
   * Get macro distribution for a date range
   */
  async getMacroDistribution(userId: number, from: string, to: string): Promise<MacroDistribution> {
    // Implementation: Aggregate macros from food logs
  }

  /**
   * Get user achievements
   */
  async getAchievements(userId: number): Promise<Achievement[]> {
    // Implementation: Calculate achievements from historical data
  }
}
```

---

### Step 2: Create useProgressData Hook

```typescript
// src/presentation/hooks/useProgressData.ts
import { useState, useEffect, useCallback } from 'react';
import { progressApiService, WeeklyDataPoint, GoalStats, MacroDistribution, Achievement } from '../../infrastructure/services/progressApi';
import { useAuth } from '../providers/AuthProvider';

export interface ProgressData {
  weeklyData: WeeklyDataPoint[];
  goalStats: GoalStats;
  macroDistribution: MacroDistribution;
  achievements: Achievement[];
}

export const useProgressData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressData = useCallback(async () => {
    // Implementation
  }, [user]);

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  return { data, isLoading, error, refresh: fetchProgressData };
};
```

---

## ✅ Summary

**Good News:**
- ✅ Most data already available via existing endpoints
- ✅ No new backend endpoints required for MVP
- ✅ Can calculate everything from existing data

**What We Need to Build:**
1. `ProgressApiService` - Aggregates existing data
2. `useProgressData` hook - React hook for Progress tab
3. Update `ProgressTracking.tsx` - Replace hardcoded data

**Estimated Time:**
- Phase 1: 2-3 hours
- Phase 2: 1 hour
- Phase 3: 1 hour
- Phase 4: 2 hours
- **Total: 6-7 hours**

---

## 🚀 Next Steps

1. **Start with Phase 1** - Weekly data integration
2. Test with real backend data
3. Move to Phase 2, 3, 4 sequentially
4. Polish UI and error handling
