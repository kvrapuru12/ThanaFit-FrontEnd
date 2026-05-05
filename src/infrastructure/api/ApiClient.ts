import AsyncStorage from '@react-native-async-storage/async-storage';
import { composeSpringApiErrorMessage } from '../../core/utils/apiErrorMessage';
import { getStoredAuthToken, tokenStorage } from '../../core/utils/tokenStorage';
import { shouldAttemptAccessTokenRefresh } from './authRefreshPolicy';

// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api', // Load from environment variable
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

const REQUEST_DEDUPE_TTL_MS = 1500;
const DEV_API_METRICS_KEY = '__THANAFIT_DEV_API_METRICS__';

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

function buildHttpErrorUserMessage(data: unknown, status: number): string {
  return composeSpringApiErrorMessage(data) ?? `HTTP ${status}`;
}

// Request Configuration
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  skipAuth?: boolean;
  // Internal guard to ensure we only retry once after refresh.
  hasRetriedAfterRefresh?: boolean;
}

// API Client Class
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;
  private refreshInFlight: Promise<string | null> | null = null;
  private inFlightGetRequests = new Map<string, { createdAt: number; promise: Promise<ApiResponse<any>> }>();

  constructor(config: Partial<typeof API_CONFIG> = {}) {
    this.baseURL = config.BASE_URL || API_CONFIG.BASE_URL;
    this.timeout = config.TIMEOUT || API_CONFIG.TIMEOUT;
    this.retryAttempts = config.RETRY_ATTEMPTS || API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = config.RETRY_DELAY || API_CONFIG.RETRY_DELAY;
  }

  // Main request method with retry logic
  async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const dedupeKey = this.getDedupeKey(config);
    if (dedupeKey) {
      const existing = this.inFlightGetRequests.get(dedupeKey);
      if (existing && Date.now() - existing.createdAt <= REQUEST_DEDUPE_TTL_MS) {
        this.recordDevMetric(config.method, config.url, 0, true, true);
        return existing.promise as Promise<ApiResponse<T>>;
      }
    }

    const requestPromise = this.executeWithRetry<T>(config);
    if (!dedupeKey) {
      return requestPromise;
    }

    const wrappedPromise = requestPromise.finally(() => {
      this.inFlightGetRequests.delete(dedupeKey);
    });
    this.inFlightGetRequests.set(dedupeKey, {
      createdAt: Date.now(),
      promise: wrappedPromise as Promise<ApiResponse<any>>,
    });
    return wrappedPromise;
  }

  private async executeWithRetry<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    let lastError: ApiError;
    const maxRetryAttempts = config.retryAttempts ?? this.retryAttempts;

    for (let attempt = 0; attempt <= maxRetryAttempts; attempt++) {
      const requestStartedAt = Date.now();
      try {
        const response = await this.makeRequest<T>(config);
        this.recordDevMetric(config.method, config.url, Date.now() - requestStartedAt, true, false);
        return response;
      } catch (error: any) {
        lastError = this.handleError(error);
        this.recordDevMetric(config.method, config.url, Date.now() - requestStartedAt, false, false);

        if (
          shouldAttemptAccessTokenRefresh(error) &&
          !config.skipAuth &&
          !config.hasRetriedAfterRefresh
        ) {
          const refreshedToken = await this.refreshAccessToken();
          if (refreshedToken) {
            return this.makeRequest<T>({
              ...config,
              hasRetriedAfterRefresh: true,
            });
          }
        }
        
        // Don't retry on client errors (4xx)
        if (lastError.status >= 400 && lastError.status < 500) {
          throw lastError;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetryAttempts) {
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
    
    // Get stored token
    const token = await this.getStoredToken();
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (!config.skipAuth && token) {
      // Check if token already has Bearer prefix
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      headers.Authorization = authToken;
    }

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
    const response = await Promise.race([
      fetch(url, requestConfig),
      timeoutPromise,
    ]);

    // Parse response
    let data;
    try {
      const responseText = await response.text();
      if (responseText.trim()) {
        data = JSON.parse(responseText);
      } else {
        data = {};
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      
      // Create a proper error response
      data = {
        message: `Server returned ${response.status}: ${response.statusText}`,
        status: response.status,
        code: 'PARSE_ERROR'
      };
    }

    if (!response.ok) {
      // Check if this is an expected backend error (e.g., when no cycle data exists)
      const isExpectedError = (response.status === 400 || response.status === 500) &&
        data.message && 
        (data.message.includes('Queue.peek()') || data.message.includes('null'));
      
      if (!isExpectedError) {
        console.error('API request failed', {
          method: config.method,
          endpoint: config.url,
          status: response.status,
          code: data?.code ?? data?.errorCode ?? 'UNKNOWN',
        });
      } else {
        if (__DEV__) {
          console.warn('Backend returned expected empty-data error', {
            endpoint: config.url,
            status: response.status,
          });
        }
      }
      
      const composedMessage = buildHttpErrorUserMessage(data, response.status);
      const apiError = new Error(composedMessage);
      (apiError as any).status = response.status;
      (apiError as any).code = data.code ?? data.errorCode;
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
    if (typeof error?.status === 'number') {
      return {
        message: error.message || `HTTP ${error.status}`,
        status: error.status,
        code: error.code,
        details: error.details || error.responseData,
      };
    }

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

  // Token management (uses tokenStorage: SecureStore on native, AsyncStorage on web)
  private async getStoredToken(): Promise<string | null> {
    return getStoredAuthToken();
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = this.performTokenRefresh();
    try {
      return await this.refreshInFlight;
    } finally {
      this.refreshInFlight = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const refreshToken = await tokenStorage.getItemAsync('refreshToken');
      if (!refreshToken) {
        return null;
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: HttpMethod.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return null;
      }

      const responseData = await response.json();
      const accessToken = responseData?.token;
      if (!accessToken || typeof accessToken !== 'string') {
        return null;
      }

      await tokenStorage.setItemAsync('authToken', accessToken);
      if (typeof responseData?.refreshToken === 'string' && responseData.refreshToken.length > 0) {
        await tokenStorage.setItemAsync('refreshToken', responseData.refreshToken);
      }

      if (typeof responseData?.expiresIn === 'number' && responseData.expiresIn > 0) {
        await AsyncStorage.setItem('tokenExpiry', String(Date.now() + responseData.expiresIn * 1000));
      }

      return accessToken;
    } catch (error) {
      console.warn('Token refresh failed:', error);
      return null;
    }
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getDedupeKey(config: RequestConfig): string | null {
    if (config.method !== HttpMethod.GET) {
      return null;
    }

    const headers = config.headers
      ? Object.entries(config.headers).sort(([a], [b]) => a.localeCompare(b))
      : [];
    return JSON.stringify({
      method: config.method,
      url: config.url,
      data: config.data ?? null,
      headers,
      skipAuth: !!config.skipAuth,
    });
  }

  private recordDevMetric(
    method: HttpMethod,
    url: string,
    durationMs: number,
    ok: boolean,
    deduped: boolean
  ): void {
    if (!__DEV__) {
      return;
    }

    const globalThisWithMetrics = globalThis as typeof globalThis & {
      [DEV_API_METRICS_KEY]?: {
        events: Array<{
          timestamp: string;
          method: HttpMethod;
          url: string;
          durationMs: number;
          ok: boolean;
          deduped: boolean;
        }>;
        byEndpoint: Record<string, { total: number; deduped: number; failed: number }>;
      };
    };

    if (!globalThisWithMetrics[DEV_API_METRICS_KEY]) {
      globalThisWithMetrics[DEV_API_METRICS_KEY] = {
        events: [],
        byEndpoint: {},
      };
    }

    const metrics = globalThisWithMetrics[DEV_API_METRICS_KEY]!;
    const endpointKey = `${method} ${url}`;
    const current = metrics.byEndpoint[endpointKey] ?? { total: 0, deduped: 0, failed: 0 };
    current.total += 1;
    if (deduped) current.deduped += 1;
    if (!ok) current.failed += 1;
    metrics.byEndpoint[endpointKey] = current;

    metrics.events.push({
      timestamp: new Date().toISOString(),
      method,
      url,
      durationMs,
      ok,
      deduped,
    });
    if (metrics.events.length > 500) {
      metrics.events.shift();
    }
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
