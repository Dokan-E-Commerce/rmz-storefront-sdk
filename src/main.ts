/**
 * RMZ Storefront SDK - Main Entry Point
 * Secure, framework-agnostic SDK for the RMZ Storefront API
 */

// Main Secure SDK (Modern, Framework-Agnostic)
export { 
  SecureStorefrontSDK,
  createStorefrontSDK,
  useStorefrontSDK,
  useStorefront,
  type StorefrontConfig,
  type ApiResponse,
  type Product,
  type Category,
  type Cart,
  type CartItem,
  type Order,
  type OrderItem,
  type Customer,
  type Review,
  type Store
} from './secure-storefront-sdk';

// Core Security & Environment (for advanced usage)
export { Environment } from './core/environment';
export { SecurityManager } from './core/security';
export { UniversalHttpClient } from './core/http-client';

// Default export (modern, secure)
export { SecureStorefrontSDK as default } from './secure-storefront-sdk';