/**
 * Security Module - HMAC Authentication & Data Protection
 * Framework-agnostic security implementation
 */

import { Environment } from './environment';

export interface SecurityConfig {
  publicKey: string;
  secretKey?: string; // Only for server-side
  signatureVersion: string;
  timestampTolerance: number;
  authToken?: string; // Bearer token for authenticated requests
  cartToken?: string; // Cart token for session management
}

export class SecurityManager {
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = {
      ...config,
      signatureVersion: config.signatureVersion || 'v1',
      timestampTolerance: config.timestampTolerance || 300 // 5 minutes
    };

    // Validate security requirements
    this.validateConfig();
  }

  /**
   * Set authentication token for authenticated requests
   */
  setAuthToken(token: string | null): void {
    this.config.authToken = token || undefined;
  }

  /**
   * Get current authentication token
   */
  getAuthToken(): string | undefined {
    return this.config.authToken;
  }

  /**
   * Set cart token for session management
   */
  setCartToken(token: string | null): void {
    this.config.cartToken = token || undefined;
  }

  /**
   * Get current cart token
   */
  getCartToken(): string | undefined {
    return this.config.cartToken;
  }

  private validateConfig(): void {
    if (!this.config.publicKey) {
      throw new Error('Public key is required');
    }

    // Server-side requires secret key for HMAC
    if (Environment.info.isServer && !this.config.secretKey) {
      throw new Error('Secret key is required for server-side operations');
    }

    // Client-side should not have secret key
    if (Environment.info.isBrowser && this.config.secretKey) {
      console.warn('Secret key detected in browser environment. This is a security risk!');
    }
  }

  /**
   * Generate HMAC signature (server-side only)
   */
  async generateSignature(
    timestamp: string,
    method: string,
    path: string,
    body: string = ''
  ): Promise<string> {
    if (!Environment.info.isServer) {
      throw new Error('Signature generation is only available server-side');
    }

    if (!this.config.secretKey) {
      throw new Error('Secret key required for signature generation');
    }

    const crypto = Environment.getCrypto();
    if (!crypto) {
      throw new Error('Crypto module not available');
    }

    // Create payload for signing
    const payload = [
      this.config.signatureVersion,
      timestamp,
      method.toUpperCase(),
      path,
      this.hashString(body, crypto)
    ].join('\n');

    // Generate HMAC signature
    const hmac = crypto.createHmac('sha256', this.config.secretKey);
    hmac.update(payload);
    return hmac.digest('hex');
  }

  /**
   * Verify HMAC signature (server-side only)
   */
  async verifySignature(
    signature: string,
    timestamp: string,
    method: string,
    path: string,
    body: string = ''
  ): Promise<boolean> {
    if (!Environment.info.isServer) {
      throw new Error('Signature verification is only available server-side');
    }

    // Check timestamp validity
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    
    if (Math.abs(now - requestTime) > this.config.timestampTolerance) {
      return false;
    }

    try {
      const expectedSignature = await this.generateSignature(timestamp, method, path, body);
      return this.constantTimeCompare(signature, expectedSignature);
    } catch {
      return false;
    }
  }

  /**
   * Get authentication headers for requests
   */
  getAuthHeaders(method: string, path: string, body: string = ''): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    const headers: Record<string, string> = {
      'X-Public-Key': this.config.publicKey,
      'X-Timestamp': timestamp,
      'X-Signature-Version': this.config.signatureVersion
    };

    // Add Bearer token for authenticated requests
    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
      // console.log('DEBUG: Adding Authorization header:', `Bearer ${this.config.authToken.substring(0, 20)}...`);
    } else {
      // console.log('DEBUG: No auth token available, skipping Authorization header');
    }

    // Add cart token for session management
    if (this.config.cartToken) {
      headers['X-Cart-Token'] = this.config.cartToken;
      // console.log('DEBUG: Adding cart token header:', this.config.cartToken.substring(0, 10) + '...');
    }

    // Add signature for both server-side and client-side requests if secret key is available
    if (this.config.secretKey) {
      try {
        if (Environment.info.isServer) {
          // For server-side, use synchronous generation
          const signature = this.generateSignatureSync(timestamp, method, path, body);
          headers['X-Signature'] = signature;
        } else if (Environment.info.isBrowser) {
          // For browser, use async Web Crypto API
          // We'll generate this synchronously using a crypto library for browser
          const signature = this.generateBrowserSignature(timestamp, method, path, body);
          headers['X-Signature'] = signature;
        }
      } catch (error) {
        console.warn('Failed to generate signature:', error);
        headers['X-Client-Auth'] = 'true';
      }
    } else {
      // No secret key available, use client auth header
      headers['X-Client-Auth'] = 'true';
    }

    return headers;
  }

  /**
   * Synchronous signature generation for Node.js
   */
  private generateSignatureSync(
    timestamp: string,
    method: string,
    path: string,
    body: string = ''
  ): string {
    if (!Environment.info.isServer || !this.config.secretKey) {
      throw new Error('Synchronous signature generation requires server environment and secret key');
    }

    const crypto = Environment.getCrypto();
    if (!crypto) {
      throw new Error('Crypto module not available');
    }

    const payload = [
      this.config.signatureVersion,
      timestamp,
      method.toUpperCase(),
      path,
      crypto.createHash('sha256').update(body).digest('hex')
    ].join('\n');

    return crypto.createHmac('sha256', this.config.secretKey).update(payload).digest('hex');
  }

  /**
   * Hash string with SHA-256
   */
  private hashString(input: string, crypto: any): string {
    if (Environment.info.isServer) {
      return crypto.createHash('sha256').update(input).digest('hex');
    } else {
      // For browser environment, we need to use Web Crypto API
      // This is a simplified implementation
      return input; // In real implementation, use Web Crypto API
    }
  }

  /**
   * Generate HMAC signature for browser environments
   * Uses a synchronous approach that mimics the server implementation
   */
  private generateBrowserSignature(
    timestamp: string,
    method: string,
    path: string,
    body: string = ''
  ): string {
    if (!this.config.secretKey) {
      throw new Error('Secret key required for signature generation');
    }

    // Use the same logic as server-side
    const bodyHash = this.sha256(body);
    const payload = [
      this.config.signatureVersion,
      timestamp,
      method.toUpperCase(),
      path,
      bodyHash
    ].join('\n');

    // Generate HMAC using the same method as server
    return this.hmacSha256(payload, this.config.secretKey);
  }

  /**
   * SHA-256 hash implementation compatible with server
   */
  private sha256(data: string): string {
    // For empty string, return the standard SHA-256 hash
    if (!data) {
      return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    }

    // Use crypto-js library approach
    return require('crypto-js/sha256')(data).toString();
  }

  /**
   * HMAC-SHA256 implementation compatible with server
   */
  private hmacSha256(data: string, key: string): string {
    const CryptoJS = require('crypto-js');
    return CryptoJS.HmacSHA256(data, key).toString();
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Sanitize data for client-side exposure
   */
  sanitizeClientData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeClientData(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: any = {};
      const sensitiveFields = [
        'password', 'secret', 'key', 'token', 'api_key', 
        'private_key', 'secret_key', 'webhook_secret',
        'email_verified_at', 'remember_token', 'deleted_at',
        'created_by', 'updated_by', 'deleted_by'
      ];

      // Allow specific legitimate tokens that are needed by the client
      const allowedTokens = [
        'session_token', 'csrf_token', 'access_token', 'refresh_token', 'token', 'cart_token'
      ];

      for (const [key, value] of Object.entries(data)) {
        const keyLower = key.toLowerCase();
        
        // Check if this is an allowed token
        const isAllowedToken = allowedTokens.some(allowedToken => 
          keyLower === allowedToken
        );
        
        const isSensitive = !isAllowedToken && sensitiveFields.some(field => 
          keyLower.includes(field) || keyLower.endsWith('_secret') || keyLower.endsWith('_token')
        );

        if (!isSensitive) {
          sanitized[key] = this.sanitizeClientData(value);
        } else {
          // Debug: Log what's being filtered out
          console.log(`🚫 SecurityManager: Filtering out sensitive field: ${key} (isAllowedToken: ${isAllowedToken})`);
        }
      }

      return sanitized;
    }

    return data;
  }

  /**
   * Generate secure random string
   */
  generateSecureRandom(length: number = 32): string {
    const crypto = Environment.getCrypto();
    
    if (Environment.info.isServer && crypto) {
      return crypto.randomBytes(length).toString('hex');
    } else if (Environment.info.isBrowser && crypto && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Fallback (less secure)
    console.warn('Using fallback random generation - not cryptographically secure');
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Validate API response integrity
   */
  validateResponse(response: any): boolean {
    // Basic validation - ensure response has expected structure
    if (!response || typeof response !== 'object') {
      return false;
    }

    // Check for success indicator
    if (response.success !== undefined && typeof response.success !== 'boolean') {
      return false;
    }

    // Validate data structure if present
    if (response.data !== undefined && response.data !== null) {
      // Sanitize data for client-side
      response.data = this.sanitizeClientData(response.data);
    }

    return true;
  }
}