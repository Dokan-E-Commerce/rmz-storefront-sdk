// Main Secure SDK (Modern, Framework-Agnostic)
export { 
  SecureStorefrontSDK,
  createStorefrontSDK,
  useStorefrontSDK,
  useStorefront,
  type StorefrontConfig,
  type ApiResponse as SecureApiResponse,
  type Product,
  type Category,
  type Cart,
  type CartItem,
  type Order,
  type OrderItem,
  type Customer,
  type Review,
  type Store,
  type Page,
  type Course,
  type CourseModule,
  type CourseProgress
} from './secure-storefront-sdk';

// Core Security & Environment (for advanced usage)
export { Environment } from './core/environment';
export { SecurityManager } from './core/security';

// Advanced Client (Firebase/Supabase style - Legacy)
export { 
  StorefrontClient,
  createStorefrontClient
} from './storefront-client';

// Advanced SDK components (Legacy)
export { AdvancedTable, QueryBuilder, type QueryOptions, type RealtimeOptions } from './advanced-sdk';

// Legacy SDK export (for backward compatibility)
export { StorefrontSDK, type StorefrontSDKConfig } from './storefront-sdk';

// Services (legacy)
export { StoreService } from './services/store.service';
export { ProductsService } from './services/products.service';
export { AuthService } from './services/auth.service';
export { CartService, type AddToCartRequest, type CartSummary } from './services/cart.service';
export { WishlistService } from './services/wishlist.service';
export { CategoriesService } from './services/categories.service';
export { OrdersService } from './services/orders.service';
export { CheckoutService, type CheckoutRequest, type PaymentMethod, type CheckoutSession, type ShippingAddress, type BillingAddress } from './services/checkout.service';
export { PagesService, type Menu, type MenuItem, type ContactForm } from './services/pages.service';

// Legacy types
export type {
  Store as LegacyStore,
  Product as LegacyProduct,
  ProductVariant,
  ProductImage,
  Category as LegacyCategory,
  Cart as LegacyCart,
  CartItem as LegacyCartItem,
  Order as LegacyOrder,
  Customer as LegacyCustomer,
  Review as LegacyReview,
  SubscriptionVariant,
  WishlistResponse,
  PaginatedResponse,
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  OTPRequest,
  VerifyOTPRequest,
  ResetPasswordRequest
} from './types';

// Utils
export { HttpClient, type HttpClientConfig } from './utils/http-client';

// Create convenience function for quick initialization (legacy)
import { StorefrontSDK, type StorefrontSDKConfig } from './storefront-sdk';
export function createLegacyStorefrontSDK(config: StorefrontSDKConfig) {
  return new StorefrontSDK(config);
}

// Default export (modern, secure)
import { SecureStorefrontSDK } from './secure-storefront-sdk';
export default SecureStorefrontSDK;