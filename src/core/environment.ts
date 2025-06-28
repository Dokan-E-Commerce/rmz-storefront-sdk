/**
 * Environment Detection and Configuration
 * Secure environment handling for client/server-side compatibility
 */

export interface EnvironmentInfo {
  isServer: boolean;
  isBrowser: boolean;
  isWebWorker: boolean;
  isNode: boolean;
  platform: 'browser' | 'node' | 'webworker' | 'unknown';
}

export class Environment {
  private static _info: EnvironmentInfo | null = null;

  static get info(): EnvironmentInfo {
    if (!this._info) {
      this._info = this.detect();
    }
    return this._info;
  }

  private static detect(): EnvironmentInfo {
    // Browser detection (most specific first)
    const isBrowser = typeof window !== 'undefined' && 
                      typeof window.document !== 'undefined' && 
                      typeof window.navigator !== 'undefined';

    // Web Worker detection
    const isWebWorker = typeof (globalThis as any).importScripts === 'function' && 
                        typeof (globalThis as any).navigator !== 'undefined' && 
                        !isBrowser;

    // Server-side detection (Node.js) - only if not browser
    const isNode = !isBrowser && 
                   typeof process !== 'undefined' && 
                   process.versions && 
                   !!process.versions.node;

    // Server-side is Node.js environment
    const isServer = isNode;

    let platform: 'browser' | 'node' | 'webworker' | 'unknown' = 'unknown';
    if (isNode) platform = 'node';
    else if (isBrowser) platform = 'browser';
    else if (isWebWorker) platform = 'webworker';

    return {
      isServer,
      isBrowser,
      isWebWorker,
      isNode,
      platform
    };
  }

  /**
   * Get environment variables securely
   * Only works server-side for security
   */
  static getEnvVar(key: string): string | undefined {
    if (!this.info.isServer) {
      console.warn(`Environment variable access attempted in ${this.info.platform} environment. Use configuration object instead.`);
      return undefined;
    }

    // Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }

    return undefined;
  }

  /**
   * Check if we can use secure features
   */
  static canUseSecureFeatures(): boolean {
    return this.info.isServer || (this.info.isBrowser && 
      typeof (globalThis as any).window !== 'undefined' && 
      (globalThis as any).window.isSecureContext);
  }

  /**
   * Get secure crypto implementation
   */
  static getCrypto(): any {
    if (this.info.isServer && typeof require !== 'undefined') {
      try {
        return require('crypto');
      } catch {
        return null;
      }
    }

    if (this.info.isBrowser && 
        typeof (globalThis as any).window !== 'undefined' && 
        (globalThis as any).window.crypto && 
        (globalThis as any).window.crypto.subtle) {
      return (globalThis as any).window.crypto;
    }

    return null;
  }

  /**
   * Check if fetch is available
   */
  static hasFetch(): boolean {
    return typeof fetch !== 'undefined';
  }

  /**
   * Get appropriate HTTP client
   */
  static getHttpClient(): any {
    // In Next.js environment, fetch should always be available
    // Next.js polyfills fetch for both client and server
    if (this.hasFetch()) {
      return fetch;
    }

    // If fetch is not available, something is wrong with the environment
    throw new Error('Fetch is not available. This should not happen in a Next.js environment.');
  }
}