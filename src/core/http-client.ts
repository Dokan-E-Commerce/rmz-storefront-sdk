/**
 * Universal HTTP Client - Framework Agnostic
 * Works in Browser, Node.js, Web Workers, and any JavaScript environment
 */

import { Environment } from './environment';
import { SecurityManager } from './security';

export interface HttpConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

export interface HttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export class UniversalHttpClient {
  private config: HttpConfig;
  private security: SecurityManager;

  constructor(config: Partial<HttpConfig>, security: SecurityManager) {
    this.config = {
      timeout: 30000,
      maxRetries: 2, // Reduced from 3 to 2
      retryDelay: 500, // Reduced from 1000ms to 500ms
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...config,
      baseUrl: config.baseUrl || ''
    };
    this.security = security;
  }

  /**
   * Make HTTP request with automatic retry and security headers
   */
  async request<T = any>(request: HttpRequest): Promise<HttpResponse<T>> {
    const url = this.buildUrl(request.url);
    const body = request.data ? JSON.stringify(request.data) : '';
    
    // Get security headers
    const authHeaders = this.security.getAuthHeaders(
      request.method,
      new URL(url).pathname,
      body
    );

    // Merge headers
    const headers = {
      ...this.config.headers,
      ...authHeaders,
      ...request.headers
    };

    // Add User-Agent for Node.js
    if (Environment.info.isNode) {
      headers['User-Agent'] = `StorefrontSDK/1.0 (${Environment.info.platform})`;
    }

    let lastError: Error;

    // Retry logic
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest({
          ...request,
          url,
          headers
        }, body);

        // Validate response security
        if (!this.security.validateResponse(response.data)) {
          throw new Error('Invalid response format');
        }

        return response as HttpResponse<T>;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (this.shouldNotRetry(error as Error) || attempt === this.config.maxRetries) {
          break;
        }

        // Calculate retry delay with exponential backoff
        let retryDelay = this.config.retryDelay * Math.pow(2, attempt);
        
        // Handle rate limiting with Retry-After header
        const status = (error as any).status || (error as any).response?.status;
        if (status === 429) {
          const retryAfter = (error as any).response?.headers?.['retry-after'];
          if (retryAfter) {
            // Retry-After can be in seconds or HTTP date
            const retryAfterMs = isNaN(retryAfter) 
              ? new Date(retryAfter).getTime() - Date.now()
              : parseInt(retryAfter) * 1000;
            
            if (retryAfterMs > 0 && retryAfterMs < 60000) { // Max 60 seconds
              retryDelay = retryAfterMs;
            }
          }
        }

        // Wait before retry
        await this.delay(retryDelay);
      }
    }

    throw lastError!;
  }

  /**
   * Make the actual HTTP request based on environment
   */
  private async makeRequest<T>(request: HttpRequest & { url: string }, body: string): Promise<HttpResponse<T>> {
    const timeout = request.timeout || this.config.timeout;

    if (Environment.info.isBrowser || Environment.hasFetch()) {
      return this.fetchRequest(request, body, timeout);
    } else if (Environment.info.isNode) {
      return this.nodeRequest(request, body, timeout);
    } else {
      throw new Error('No HTTP client available for this environment');
    }
  }

  /**
   * Fetch-based request (Browser/Node.js with fetch)
   */
  private async fetchRequest<T>(request: HttpRequest & { url: string }, body: string, timeout: number): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        method: request.method,
        headers: request.headers,
        signal: controller.signal
      };

      if (request.method !== 'GET') {
        fetchOptions.body = body;
      }

      const response = await fetch(request.url, fetchOptions);
      clearTimeout(timeoutId);

      const responseData = await this.parseResponse(response);

      // Check for HTTP error status codes
      if (!response.ok) {
        // Create a plain object error instead of Error instance to avoid stack traces
        const error = {
          message: responseData.message || `HTTP ${response.status}: ${response.statusText}`,
          response: {
            data: responseData,
            status: response.status,
            statusText: response.statusText,
            headers: this.extractHeaders(response.headers)
          },
          status: response.status,
          name: 'HttpError'
        };
        throw error;
      }

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: this.extractHeaders(response.headers)
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.normalizeError(error);
    }
  }

  /**
   * Node.js request (fallback for environments without fetch)
   */
  private async nodeRequest<T>(request: HttpRequest & { url: string }, body: string, timeout: number): Promise<HttpResponse<T>> {
    // Try to use available Node.js HTTP client
    const httpClient = Environment.getHttpClient();
    
    if (httpClient.default) {
      // Using axios
      const axios = httpClient.default;
      try {
        const response = await axios({
          method: request.method,
          url: request.url,
          data: request.method !== 'GET' ? JSON.parse(body || '{}') : undefined,
          headers: request.headers,
          timeout
        });

        return {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        };
      } catch (error: any) {
        throw this.normalizeError(error);
      }
    } else {
      // Using node-fetch or similar
      return this.fetchRequest(request, body, timeout);
    }
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json();
    } else if (contentType.includes('text/')) {
      return response.text();
    } else {
      return response.blob();
    }
  }

  /**
   * Extract headers from response
   */
  private extractHeaders(headers: Headers | Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else {
      Object.assign(result, headers);
    }

    return result;
  }

  /**
   * Build full URL
   */
  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Check if error should not be retried
   */
  private shouldNotRetry(error: any): boolean {
    // Get the HTTP status code from the error
    const status = error.status || error.response?.status;
    
    if (status) {
      // Don't retry on client errors (4xx) - these are permanent errors
      if (status >= 400 && status < 500) {
        // Exception: 408 (Request Timeout) and 429 (Too Many Requests) can be retried
        return !(status === 408 || status === 429);
      }
      
      // Don't retry on certain server errors that are permanent
      if (status === 501 || status === 505) { // Not Implemented, HTTP Version Not Supported
        return true;
      }
    }

    // Don't retry on certain network errors
    const nonRetryableErrors = ['ENOTFOUND', 'ECONNREFUSED', 'CERT_', 'ABORT_ERR'];
    return nonRetryableErrors.some(err => error.message?.includes(err));
  }

  /**
   * Normalize errors across different HTTP clients
   */
  private normalizeError(error: any): any {
    // If the error already has the proper structure (from our error handling), return it as-is
    if (error.response && error.response.data) {
      return error;
    }
    
    if (error.response) {
      // Axios-style error - return as plain object
      return {
        message: `HTTP ${error.response.status}: ${error.response.statusText}`,
        response: error.response,
        status: error.response.status,
        name: 'HttpError'
      };
    } else if (error.status) {
      // Fetch-style error - return as plain object
      return {
        message: `HTTP ${error.status}: ${error.statusText}`,
        status: error.status,
        name: 'HttpError'
      };
    } else {
      // Network or other error - only create Error object for genuine network errors
      if (error instanceof Error && (error.name === 'TypeError' || error.name === 'NetworkError')) {
        return error; // Keep genuine network errors as Error objects
      }
      // For other errors, return as plain object
      return {
        message: String(error),
        name: 'UnknownError'
      };
    }
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  async get<T = any>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    let requestUrl = url;
    
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      }
      
      const queryString = searchParams.toString();
      if (queryString) {
        requestUrl += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    
    return this.request<T>({ method: 'GET', url: requestUrl, headers });
  }

  async post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, headers });
  }

  async put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, headers });
  }

  async patch<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, headers });
  }

  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, headers });
  }
}