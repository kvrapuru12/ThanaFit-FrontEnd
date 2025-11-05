import { apiClient } from '../api/ApiClient';

// Cycle Data Types
export interface Cycle {
  id: number;
  userId: number;
  periodStartDate: string;
  cycleLength: number;
  periodDuration: number;
  isCycleRegular: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCycleRequest {
  userId: number;
  periodStartDate: string; // YYYY-MM-DD format
  cycleLength?: number; // Optional, default 28, min 21, max 40
  periodDuration?: number; // Optional, default 5, min 1, max 10
  isCycleRegular?: boolean; // Optional, default true
}

export interface UpdateCycleRequest {
  periodStartDate?: string; // YYYY-MM-DD format
  cycleLength?: number; // Optional, min 21, max 40
  periodDuration?: number; // Optional, min 1, max 10
  isCycleRegular?: boolean; // Optional
}

export interface CreateCycleResponse {
  id: number;
  createdAt: string;
}

export interface UpdateCycleResponse {
  message: string;
}

export interface FoodRecommendation {
  phase: string;
  recommendedFoods: string[];
  avoid: string[];
  reasoning: string;
}

export interface ActivityRecommendation {
  phase: string;
  recommendedWorkouts: string[];
  avoid: string[];
  note: string;
}

// Cycle API Service
export class CycleApiService {
  private baseUrl = '/cycles';

  /**
   * Create a new menstrual cycle
   */
  async createCycle(cycleData: CreateCycleRequest): Promise<CreateCycleResponse> {
    try {
      console.log('=== CREATE CYCLE API CALL ===');
      console.log('Creating cycle:', cycleData);
      console.log('============================');
      
      const response = await apiClient.post<CreateCycleResponse>(this.baseUrl, cycleData);
      console.log('Cycle created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create cycle:', error);
      throw error;
    }
  }

  /**
   * Update an existing menstrual cycle
   */
  async updateCycle(cycleId: number, cycleData: UpdateCycleRequest): Promise<UpdateCycleResponse> {
    try {
      console.log('=== UPDATE CYCLE API CALL ===');
      console.log('Updating cycle:', cycleId, cycleData);
      console.log('=============================');
      
      const response = await apiClient.patch<UpdateCycleResponse>(`${this.baseUrl}/${cycleId}`, cycleData);
      console.log('Cycle updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update cycle:', error);
      throw error;
    }
  }

  /**
   * Get cycles for a user (if GET endpoint exists)
   */
  async getCycles(userId?: number, page: number = 1, limit: number = 20): Promise<Cycle[]> {
    try {
      console.log('=== GET CYCLES API CALL ===');
      console.log('Fetching cycles for userId:', userId);
      console.log('===========================');
      
      const queryParams = new URLSearchParams();
      if (userId) queryParams.append('userId', userId.toString());
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      const url = `${this.baseUrl}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Full URL:', url);
      const response = await apiClient.get<{ items: Cycle[] } | Cycle[]>(url);
      
      console.log('Raw response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Is array:', Array.isArray(response.data));
      console.log('Response data keys:', response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'N/A');
      
      // Handle both array and paginated response
      let cycles: Cycle[] = [];
      if (Array.isArray(response.data)) {
        cycles = response.data;
        console.log('Found cycles as direct array');
      } else if (response.data && typeof response.data === 'object') {
        // Check for different pagination formats
        if ('items' in response.data) {
          cycles = response.data.items || [];
          console.log('Found cycles in items property');
        } else if ('content' in response.data) {
          // Handle Spring Boot pagination format
          cycles = (response.data as any).content || [];
          console.log('Found cycles in content property');
        } else if ('cycles' in response.data) {
          // Handle cycles array format
          cycles = (response.data as any).cycles || [];
          console.log('Found cycles in cycles property:', cycles);
        } else if ('data' in response.data) {
          // Handle nested data format
          cycles = Array.isArray((response.data as any).data) ? (response.data as any).data : [];
          console.log('Found cycles in data property');
        } else {
          console.log('Warning: Could not find cycles array in response. Response structure:', JSON.stringify(response.data, null, 2));
        }
      }
      
      console.log('Parsed cycles:', cycles);
      console.log('Number of cycles found:', cycles.length);
      return cycles;
    } catch (error: any) {
      // Handle backend error when no cycles exist (backend bug returns error instead of empty array)
      if (error?.status === 400 || error?.status === 500) {
        const errorMessage = error?.message || error?.responseData?.message || '';
        if (errorMessage.includes('Queue.peek()') || errorMessage.includes('null')) {
          // Backend bug: returns error when no cycles exist instead of empty array
          console.log('No cycles found - backend returned error (expected when no data exists)');
          return [];
        }
      }
      console.error('Failed to fetch cycles:', error);
      console.error('Error details:', error);
      // Return empty array on error - don't break the app
      return [];
    }
  }

  /**
   * Get the most recent cycle for a user
   */
  async getMostRecentCycle(userId?: number): Promise<Cycle | null> {
    try {
      const cycles = await this.getCycles(userId, 1, 1);
      if (cycles.length > 0) {
        return cycles[0]; // Assuming cycles are sorted by date descending
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch most recent cycle:', error);
      return null;
    }
  }

  /**
   * Get food recommendations for current cycle phase
   */
  async getFoodRecommendations(): Promise<FoodRecommendation> {
    try {
      console.log('=== GET FOOD RECOMMENDATIONS API CALL ===');
      const response = await apiClient.get<FoodRecommendation>('/ai/suggestions/cycle-sync/food');
      console.log('Food recommendations fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch food recommendations:', error);
      throw error;
    }
  }

  /**
   * Get activity recommendations for current cycle phase
   */
  async getActivityRecommendations(): Promise<ActivityRecommendation> {
    try {
      console.log('=== GET ACTIVITY RECOMMENDATIONS API CALL ===');
      const response = await apiClient.get<ActivityRecommendation>('/ai/suggestions/cycle-sync/activity');
      console.log('Activity recommendations fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch activity recommendations:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const cycleApiService = new CycleApiService();

