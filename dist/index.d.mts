export { A as ApiResponse, d as Cart, e as CartItem, C as Category, g as Customer, E as Environment, O as Order, f as OrderItem, P as Product, R as Review, S as SecureStorefrontSDK, h as Store, b as StorefrontConfig, c as createStorefrontSDK, S as default, a as useStorefront, u as useStorefrontSDK } from './secure-storefront-sdk-D-9ZWhj3.mjs';

/**
 * Security Module - HMAC Authentication & Data Protection
 * Framework-agnostic security implementation
 */
interface SecurityConfig {
    publicKey: string;
    secretKey?: string;
    signatureVersion: string;
    timestampTolerance: number;
    authToken?: string;
    cartToken?: string;
}
declare class SecurityManager {
    private config;
    constructor(config: SecurityConfig);
    /**
     * Set authentication token for authenticated requests
     */
    setAuthToken(token: string | null): void;
    /**
     * Get current authentication token
     */
    getAuthToken(): string | undefined;
    /**
     * Set cart token for session management
     */
    setCartToken(token: string | null): void;
    /**
     * Get current cart token
     */
    getCartToken(): string | undefined;
    private validateConfig;
    /**
     * Generate HMAC signature (server-side only)
     */
    generateSignature(timestamp: string, method: string, path: string, body?: string): Promise<string>;
    /**
     * Verify HMAC signature (server-side only)
     */
    verifySignature(signature: string, timestamp: string, method: string, path: string, body?: string): Promise<boolean>;
    /**
     * Get authentication headers for requests
     */
    getAuthHeaders(method: string, path: string, body?: string): Record<string, string>;
    /**
     * Synchronous signature generation for Node.js
     */
    private generateSignatureSync;
    /**
     * Hash string with SHA-256
     */
    private hashString;
    /**
     * Generate HMAC signature for browser environments
     * Uses a synchronous approach that mimics the server implementation
     */
    private generateBrowserSignature;
    /**
     * SHA-256 hash implementation compatible with server
     */
    private sha256;
    /**
     * HMAC-SHA256 implementation compatible with server
     */
    private hmacSha256;
    /**
     * Constant-time string comparison to prevent timing attacks
     */
    private constantTimeCompare;
    /**
     * Sanitize data for client-side exposure
     */
    sanitizeClientData(data: any): any;
    /**
     * Generate secure random string
     */
    generateSecureRandom(length?: number): string;
    /**
     * Validate API response integrity
     */
    validateResponse(response: any): boolean;
}

/**
 * Universal HTTP Client - Framework Agnostic
 * Works in Browser, Node.js, Web Workers, and any JavaScript environment
 */

interface HttpConfig {
    baseUrl: string;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
    headers: Record<string, string>;
}
interface HttpRequest {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
    url: string;
    data?: any;
    headers?: Record<string, string>;
    timeout?: number;
}
interface HttpResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}
declare class UniversalHttpClient {
    private config;
    private security;
    constructor(config: Partial<HttpConfig>, security: SecurityManager);
    /**
     * Make HTTP request with automatic retry and security headers
     */
    request<T = any>(request: HttpRequest): Promise<HttpResponse<T>>;
    /**
     * Make the actual HTTP request based on environment
     */
    private makeRequest;
    /**
     * Fetch-based request (Browser/Node.js with fetch)
     */
    private fetchRequest;
    /**
     * Node.js request (fallback for environments without fetch)
     */
    private nodeRequest;
    /**
     * Parse response based on content type
     */
    private parseResponse;
    /**
     * Extract headers from response
     */
    private extractHeaders;
    /**
     * Build full URL
     */
    private buildUrl;
    /**
     * Check if error should not be retried
     */
    private shouldNotRetry;
    /**
     * Normalize errors across different HTTP clients
     */
    private normalizeError;
    /**
     * Delay utility for retries
     */
    private delay;
    get<T = any>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    patch<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    delete<T = any>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>;
}

export { SecurityManager, UniversalHttpClient };
