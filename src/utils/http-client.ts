import { ApiResponse } from '../types';

export interface HttpClientConfig {
  baseURL: string;
  publicKey: string;
  secretKey: string;
  timeout?: number;
  headers?: Record<string, string>;
  environment?: 'production' | 'development';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export class HttpClient {
  private config: HttpClientConfig;
  private readonly SIGNATURE_VERSION = 'v1';
  private authToken?: string;
  private cartToken?: string;

  constructor(config: HttpClientConfig) {
    this.config = config;

    if (!config.publicKey || !config.secretKey) {
      throw new Error('Both publicKey and secretKey are required for HMAC authentication');
    }
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.authToken = token;
  }

  // Clear authentication token
  clearAuthToken() {
    this.authToken = undefined;
  }

  // Set cart token
  setCartToken(token: string) {
    this.cartToken = token;
  }

  // Clear cart token
  clearCartToken() {
    this.cartToken = undefined;
  }

  /**
   * Generate HMAC signature for request
   */
  private async generateSignature(
    timestamp: string,
    method: string,
    path: string,
    body: string = ''
  ): Promise<string> {
    const payload = [
      this.SIGNATURE_VERSION,
      timestamp,
      method.toUpperCase(),
      path,
      await this.hashSHA256(body)
    ].join('\n');

    return await this.hmacSHA256(payload, this.config.secretKey);
  }

  /**
   * SHA-256 hash
   */
  private async hashSHA256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * HMAC-SHA256 signature
   */
  private async hmacSHA256(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const signatureArray = Array.from(new Uint8Array(signature));
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Make a secure API request
   */
  private async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {}
    } = options;

    // Construct full URL
    let fullUrl: string;
    if (endpoint.startsWith('http')) {
      fullUrl = endpoint;
    } else {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      const baseWithSlash = this.config.baseURL.endsWith('/') ? this.config.baseURL : this.config.baseURL + '/';
      fullUrl = baseWithSlash + cleanEndpoint;
    }

    const url = new URL(fullUrl);
    const path = url.pathname + url.search;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = body ? JSON.stringify(body) : '';

    // Generate HMAC signature
    const signature = await this.generateSignature(timestamp, method, path, bodyString);

    // Prepare headers with HMAC authentication
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Public-Key': this.config.publicKey,
      'X-Signature': signature,
      'X-Timestamp': timestamp,
      'X-Signature-Version': this.SIGNATURE_VERSION,
      ...headers
    };

    // Add authentication token when available
    // Public routes will ignore it, authenticated routes will use it
    if (this.authToken) {
      requestHeaders.Authorization = `Bearer ${this.authToken}`;
    }

    // Add cart token for cart operations
    if (this.cartToken) {
      requestHeaders['X-Cart-Token'] = this.cartToken;
    }

    // Make request
    const response = await fetch(url.toString(), {
      method,
      headers: requestHeaders,
      body: bodyString || undefined,
      credentials: 'omit'
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
    }

    // Parse response body
    let responseData: any;
    try {
      responseData = await response.json();
    } catch (parseError) {
      // If JSON parsing fails, create a generic error
      const error = new Error(`Invalid JSON response: ${response.statusText}`) as any;
      error.response = {
        data: { message: `Invalid JSON response: ${response.statusText}` },
        status: response.status,
        statusText: response.statusText
      };
      error.status = response.status;
      throw error;
    }

    // Handle errors
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        this.authToken = undefined;
      }

      // Create axios-style error for better compatibility
      const error = new Error(responseData.message || `HTTP ${response.status}: ${response.statusText}`) as any;
      error.response = {
        data: responseData,
        status: response.status,
        statusText: response.statusText
      };
      error.status = response.status;

      throw error;
    }

    // For successful responses, return the data directly
    // The API might return data wrapped in { data: ... } or directly
    if (responseData && typeof responseData === 'object') {
      // If response has a 'data' property, return it as ApiResponse format
      if (responseData.hasOwnProperty('data')) {
        return responseData as ApiResponse<T>;
      } else {
        // If response is the data directly, wrap it in ApiResponse format
        return {
          success: true,
          data: responseData
        } as ApiResponse<T>;
      }
    }

    // Fallback for non-object responses
    return {
      success: true,
      data: responseData
    } as ApiResponse<T>;
  }

  // HTTP methods
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  async post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'POST', body: data, headers });
  }

  async put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PUT', body: data, headers });
  }

  async patch<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PATCH', body: data, headers });
  }

  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }
}
