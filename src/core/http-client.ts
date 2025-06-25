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
      maxRetries: 3,
      retryDelay: 1000,
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

        // Wait before retry
        await this.delay(this.config.retryDelay * Math.pow(2, attempt));
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
  private shouldNotRetry(error: Error): boolean {
    // Don't retry on client errors (4xx) except 429 (rate limit)
    if (error.message.includes('4')) {
      return !error.message.includes('429');
    }

    // Don't retry on certain network errors
    const nonRetryableErrors = ['ENOTFOUND', 'ECONNREFUSED', 'CERT_'];
    return nonRetryableErrors.some(err => error.message.includes(err));
  }

  /**
   * Normalize errors across different HTTP clients
   */
  private normalizeError(error: any): Error {
    if (error.response) {
      // Axios-style error
      return new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
    } else if (error.status) {
      // Fetch-style error
      return new Error(`HTTP ${error.status}: ${error.statusText}`);
    } else {
      // Network or other error
      return error instanceof Error ? error : new Error(String(error));
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