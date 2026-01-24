import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api', // Load from environment variable
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// HTTP Methods
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Request Configuration
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
}

// API Client Class
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: Partial<typeof API_CONFIG> = {}) {
    this.baseURL = config.BASE_URL || API_CONFIG.BASE_URL;
    this.timeout = config.TIMEOUT || API_CONFIG.TIMEOUT;
    this.retryAttempts = config.RETRY_ATTEMPTS || API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = config.RETRY_DELAY || API_CONFIG.RETRY_DELAY;
  }

  // Main request method with retry logic
  async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    let lastError: ApiError;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.makeRequest<T>(config);
      } catch (error: any) {
        lastError = this.handleError(error);
        
        // Don't retry on client errors (4xx)
        if (lastError.status >= 400 && lastError.status < 500) {
          throw lastError;
        }
        
        // Don't retry on last attempt
        if (attempt === this.retryAttempts) {
          throw lastError;
        }
        
        // Wait before retry
        await this.delay(this.retryDelay * (attempt + 1));
      }
    }

    throw lastError!;
  }

  // Individual request method
  private async makeRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${config.url}`;
    
    // Debug URL construction
    console.log('=== API CLIENT URL DEBUG ===');
    console.log('Base URL:', this.baseURL);
    console.log('Config URL:', config.url);
    console.log('Final URL:', url);
    console.log('============================');
    
    // Get stored token
    const token = await this.getStoredToken();
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (token) {
      // Check if token already has Bearer prefix
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      headers.Authorization = authToken;
    }

    // Log detailed request information
    console.log('=== BACKEND API REQUEST ===');
    console.log('URL:', url);
    console.log('Method:', config.method);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Request Body:', config.data ? JSON.stringify(config.data, null, 2) : 'No body');
    console.log('Timeout:', config.timeout || this.timeout, 'ms');
    console.log('==========================');

    // Create request config
    const requestConfig: RequestInit = {
      method: config.method,
      headers,
      body: config.data ? JSON.stringify(config.data) : undefined,
    };

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), config.timeout || this.timeout);
    });

    // Make request with timeout
    console.log('Sending request to backend...');
    const response = await Promise.race([
      fetch(url, requestConfig),
      timeoutPromise,
    ]);
    console.log('Received response from backend');

    // Parse response
    let data;
    try {
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      if (responseText.trim()) {
        data = JSON.parse(responseText);
      } else {
        data = {};
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Create a proper error response
      data = {
        message: `Server returned ${response.status}: ${response.statusText}`,
        status: response.status,
        code: 'PARSE_ERROR'
      };
    }

    // Log detailed response information
    console.log('=== BACKEND API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('OK:', response.ok);
    console.log('Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    console.log('Response Data:', JSON.stringify(data, null, 2));
    console.log('============================');

    if (!response.ok) {
      // Check if this is an expected backend error (e.g., when no cycle data exists)
      const isExpectedError = (response.status === 400 || response.status === 500) &&
        data.message && 
        (data.message.includes('Queue.peek()') || data.message.includes('null'));
      
      if (!isExpectedError) {
        // Log detailed error information only for unexpected errors
        console.error('=== BACKEND API ERROR ===');
        console.error('Error Status:', response.status);
        console.error('Error Status Text:', response.statusText);
        console.error('Error URL:', url);
        console.error('Error Method:', config.method);
        console.error('Request Body:', config.data ? JSON.stringify(config.data, null, 2) : 'No body');
        console.error('Response Data:', JSON.stringify(data, null, 2));
        console.error('Error Message:', data.message);
        console.error('Error Code:', data.code);
        console.error('Validation Errors:', data.errors || data.validationErrors || data.details || data.fieldErrors);
        console.error('=========================');
      } else {
        // Log as info instead of error for expected backend errors
        console.log('Backend returned expected error (no data exists):', data.message);
      }
      
      // Create a more detailed error object
      const apiError = new Error(data.message || `HTTP ${response.status}`);
      (apiError as any).status = response.status;
      (apiError as any).code = data.code;
      (apiError as any).details = data.errors || data.validationErrors || data.details || data.fieldErrors;
      (apiError as any).responseData = data;
      throw apiError;
    }

    return {
      data,
      status: response.status,
      message: data.message,
    };
  }

  // Error handling
  private handleError(error: any): ApiError {
    if (error.name === 'ApiError') {
      return error;
    }

    // Network errors
    if (error instanceof TypeError) {
      return {
        message: 'Network error - please check your connection',
        status: 0,
        code: 'NETWORK_ERROR',
      };
    }

    // Timeout errors
    if (error.message === 'Request timeout') {
      return {
        message: 'Request timeout - please try again',
        status: 408,
        code: 'TIMEOUT',
      };
    }

    // Generic error
    return {
      message: error.message || 'An unexpected error occurred',
      status: 500,
      code: 'UNKNOWN_ERROR',
    };
  }

  // Token management
  private async getStoredToken(): Promise<string | null> {
    try {
      // Get token from SecureStore (where we now store sensitive tokens)
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      console.error('Failed to get stored token:', error);
      return null;
    }
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  async get<T>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: HttpMethod.GET,
      url,
      ...config,
    });
  }

  async post<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: HttpMethod.POST,
      url,
      data,
      ...config,
    });
  }

  async put<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: HttpMethod.PUT,
      url,
      data,
      ...config,
    });
  }

  async patch<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: HttpMethod.PATCH,
      url,
      data,
      ...config,
    });
  }

  async delete<T>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: HttpMethod.DELETE,
      url,
      ...config,
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
