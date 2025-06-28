/**
 * Secure Storefront SDK - Framework Agnostic
 * Works with any JavaScript framework: React, Vue, Angular, Svelte, Vanilla JS
 * Supports both client-side and server-side environments
 */

import { Environment } from './core/environment';
import { SecurityManager } from './core/security';
import { UniversalHttpClient } from './core/http-client';

export interface StorefrontConfig {
  apiUrl: string;
  publicKey: string;
  secretKey?: string; // Only for server-side
  environment?: 'production' | 'development';
  version?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_more_pages: boolean;
  };
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  image?: {
    url: string;
    alt?: string;
  };
  category?: Category;
  is_featured?: boolean;
  stock?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface Cart {
  items: CartItem[];
  count: number;
  subtotal: number;
  total: number;
  currency: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

export interface Store {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  currency: string;
  settings?: Record<string, any>;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface Order {
  id: number;
  status: string;
  items: OrderItem[];
  total: number;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product: Product;
  quantity: number;
  price: number;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  reviewer: {
    id: number;
    name: string;
    email?: string;
  } | null;
  product?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  created_at: string;
}

export interface Page {
  id: number;
  title: string;
  url: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  is_active: boolean;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  modules: CourseModule[];
  progress?: CourseProgress;
}

export interface CourseModule {
  id: number;
  title: string;
  content: string;
  order: number;
  is_completed?: boolean;
}

export interface CourseProgress {
  course_id: number;
  completed_modules: number;
  total_modules: number;
  progress_percentage: number;
}

/**
 * Main Storefront SDK Class
 * Framework-agnostic with client/server-side support
 */
export class SecureStorefrontSDK {
  private config: StorefrontConfig & {
    environment: 'production' | 'development';
    version: string;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
    enableLogging: boolean;
  };
  private security: SecurityManager;
  private http: UniversalHttpClient;
  private static instances: Map<string, SecureStorefrontSDK> = new Map();

  constructor(config: StorefrontConfig) {
    this.config = {
      environment: 'production',
      version: '1.0.0',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      enableLogging: false,
      ...config
    };

    // Initialize security manager
    this.security = new SecurityManager({
      publicKey: this.config.publicKey,
      secretKey: this.config.secretKey,
      signatureVersion: 'v1',
      timestampTolerance: 300
    });

    // Initialize HTTP client
    this.http = new UniversalHttpClient(
      {
        baseUrl: this.config.apiUrl,
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries,
        retryDelay: this.config.retryDelay
      },
      this.security
    );

    this.log('SDK initialized', { environment: Environment.info.platform });
  }

  /**
   * Set authentication token for authenticated requests
   */
  setAuthToken(token: string | null): void {
    this.security.setAuthToken(token);
    this.log('Auth token updated', { hasToken: !!token });
  }

  /**
   * Get current authentication token
   */
  getAuthToken(): string | undefined {
    return this.security.getAuthToken();
  }

  /**
   * Set cart token for session management
   */
  setCartToken(token: string | null): void {
    this.security.setCartToken(token);
    this.log('Cart token updated', { hasToken: !!token });
  }

  /**
   * Get current cart token
   */
  getCartToken(): string | undefined {
    return this.security.getCartToken();
  }

  /**
   * Create singleton instance (recommended for most use cases)
   */
  static createInstance(config: StorefrontConfig): SecureStorefrontSDK {
    const key = `${config.apiUrl}_${config.publicKey}`;

    if (!this.instances.has(key)) {
      this.instances.set(key, new SecureStorefrontSDK(config));
    }

    return this.instances.get(key)!;
  }

  /**
   * Store API
   */
  get store() {
    return {
      get: async (params?: { include?: string[] }): Promise<Store> => {
        const response = await this.http.get<ApiResponse<Store>>('/store', {
          'X-Include': params?.include?.join(',') || ''
        });
        return (response.data as any).data || response.data;
      },

      getCurrencies: async (): Promise<Array<{ code: string; symbol: string; name: string }>> => {
        const response = await this.http.get<ApiResponse<any>>('/store/currencies');
        return (response.data as any).data || response.data;
      },

      changeCurrency: async (currency: string): Promise<void> => {
        await this.http.post('/store/currency', { symbol: currency });
      },

      getSettings: async (): Promise<Record<string, any>> => {
        const response = await this.http.get<ApiResponse<any>>('/store/settings');
        return (response.data as any).data || response.data;
      },

      getFeatures: async (): Promise<Array<{
        id: number;
        title: string;
        description: string;
        icon: string;
        sort_order: number;
      }>> => {
        const response = await this.http.get<ApiResponse<any>>('/store/features');
        return (response.data as any).data || response.data;
      },

      getBanners: async (): Promise<Array<{
        id: number;
        title: string;
        description: string;
        image_url: string;
        link_url: string;
        sort_order: number;
      }>> => {
        const response = await this.http.get<ApiResponse<any>>('/store/banners');
        return (response.data as any).data || response.data;
      }
    };
  }

  /**
   * Products API with Firebase/Supabase-style query builder
   */
  get products() {
    return {
      // Firebase/Supabase-style method chaining
      where: (field: string, operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like', value: any) => ({
        orderBy: (orderField: string, direction: 'asc' | 'desc' = 'asc') => ({
          limit: (count: number) => ({
            get: async (): Promise<Product[]> => {
              const params = this.buildProductParams({ field, operator, value }, orderField, direction, count);
              const response = await this.http.get<ApiResponse<Product[]>>('/products', params);
              return (response.data as any).data || response.data;
            }
          }),
          get: async (): Promise<Product[]> => {
            const params = this.buildProductParams({ field, operator, value }, orderField, direction);
            const response = await this.http.get<ApiResponse<Product[]>>('/products', params);
            return (response.data as any).data || response.data;
          }
        }),
        get: async (): Promise<Product[]> => {
          const params = this.buildProductParams({ field, operator, value });
          const response = await this.http.get<ApiResponse<Product[]>>('/products', params);
          return (response.data as any).data || response.data;
        }
      }),

      // Direct methods
      getAll: async (params?: {
        page?: number;
        per_page?: number;
        search?: string;
        category?: string;
        sort?: string;
      }): Promise<{ data: Product[]; pagination?: any }> => {
        const response = await this.http.get<ApiResponse<Product[]>>('/products', params);
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      },

      getById: async (id: number): Promise<Product> => {
        const response = await this.http.get<ApiResponse<Product>>(`/products/${id}`);
        return (response.data as any).data || response.data;
      },

      getBySlug: async (slug: string): Promise<Product> => {
        const response = await this.http.get<ApiResponse<Product>>(`/products/${slug}`);
        return (response.data as any).data || response.data;
      },

      search: async (query: string, options?: {
        category?: string;
        price_min?: number;
        price_max?: number;
        per_page?: number;
      }): Promise<{ data: Product[]; pagination?: any }> => {
        const response = await this.http.get<ApiResponse<Product[]>>('/products/search', {
          q: query,
          ...options
        });
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      },

      getFeatured: async (limit = 8): Promise<Product[]> => {
        const response = await this.http.get<ApiResponse<Product[]>>('/featured-products', { limit });
        return (response.data as any).data || response.data;
      },

      getRelated: async (productId: number, limit = 4): Promise<Product[]> => {
        const response = await this.http.get<ApiResponse<Product[]>>(`/products/${productId}/related`, { limit });
        return (response.data as any).data || response.data;
      },

      getReviews: async (productId: number, params?: { page?: number; per_page?: number }): Promise<{
        data: Review[];
        pagination?: any;
      }> => {
        const response = await this.http.get<ApiResponse<Review[]>>(`/products/${productId}/reviews`, params);
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
    };
  }

  /**
   * Categories API
   */
  get categories() {
    return {
      getAll: async (): Promise<Category[]> => {
        const response = await this.http.get<ApiResponse<Category[]>>('/categories');
        return (response.data as any).data || response.data;
      },

      getById: async (id: number): Promise<Category> => {
        const response = await this.http.get<ApiResponse<Category>>(`/categories/${id}`);
        return (response.data as any).data || response.data;
      },

      getBySlug: async (slug: string): Promise<Category> => {
        const response = await this.http.get<ApiResponse<Category>>(`/categories/${slug}`);
        return (response.data as any).data || response.data;
      },

      getProducts: async (slug: string, params?: {
        page?: number;
        per_page?: number;
        sort?: string;
      }): Promise<{ data: Product[]; pagination?: any }> => {
        const response = await this.http.get<ApiResponse<Product[]>>(`/categories/${slug}/products`, params);
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
    };
  }

  /**
   * Helper method to handle cart token from response
   */
  private handleCartResponse(responseData: any): any {
    if (!responseData) {
      throw new Error('No response data from server.');
    }
    // If the response is an error object from the backend, propagate the message
    if (responseData.success === false && responseData.message) {
      throw new Error(responseData.message);
    }
    // Extract cart_token from response and store it
    if (responseData.cart_token) {
      this.setCartToken(responseData.cart_token);
    }
    return responseData;
  }

  /**
   * Cart API
   */
  get cart() {
    return {
      get: async (): Promise<Cart> => {
        const response = await this.http.get<ApiResponse<Cart>>('/cart');
        return this.handleCartResponse(response.data.data);
      },

      addItem: async (productId: number, quantity = 1, options?: {
        fields?: Record<string, any>;
        notice?: string;
      }): Promise<Cart> => {
        const response = await this.http.post<ApiResponse<Cart>>('/cart/add', {
          product_id: productId,
          qty: quantity,
          ...options
        });
        return this.handleCartResponse(response.data.data);
      },

      updateItem: async (itemId: string, quantity: number): Promise<Cart> => {
        const response = await this.http.patch<ApiResponse<Cart>>(`/cart/items/${itemId}`, {
          quantity
        });
        return this.handleCartResponse(response.data.data);
      },

      removeItem: async (itemId: string): Promise<Cart> => {
        const response = await this.http.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`);
        return this.handleCartResponse(response.data.data);
      },

      clear: async (): Promise<void> => {
        await this.http.delete('/cart/clear');
        // Clear the stored cart token when cart is cleared
        this.setCartToken(null);
      },

      getCount: async (): Promise<number> => {
        const response = await this.http.get<ApiResponse<{ count: number; cart_token?: string }>>('/cart/count');
        // Handle cart token from count response as well
        if (response.data.data.cart_token) {
          this.setCartToken(response.data.data.cart_token);
        }
        return response.data.data.count;
      },

      applyCoupon: async (code: string): Promise<Cart> => {
        const response = await this.http.post<ApiResponse<Cart>>('/cart/coupon', { coupon: code });
        return this.handleCartResponse(response.data.data);
      },

      removeCoupon: async (): Promise<Cart> => {
        const response = await this.http.delete<ApiResponse<Cart>>('/cart/coupon');
        return this.handleCartResponse(response.data.data);
      },

      validate: async (): Promise<{ valid: boolean; errors?: string[] }> => {
        const response = await this.http.get<ApiResponse<any>>('/cart/validate');
        return (response.data as any).data || response.data;
      },

      getSummary: async (): Promise<{
        subtotal: number;
        tax: number;
        shipping: number;
        discount: number;
        total: number;
      }> => {
        const response = await this.http.get<ApiResponse<any>>('/cart/summary');
        return (response.data as any).data || response.data;
      }
    };
  }

  /**
   * Authentication API (client-side compatible)
   */
  get auth() {
    return {
      startPhoneAuth: async (phone: string, countryCode: string): Promise<{ session_token: string }> => {
        const response = await this.http.post<ApiResponse<any>>('/auth/phone/start', {
          phone,
          country_code: countryCode
        });
        console.log('SecureSDK: startPhoneAuth full response:', response);
        console.log('SecureSDK: response.data:', response.data);
        console.log('SecureSDK: response.data.data:', response.data.data);

        // Laravel API returns: { success: true, data: { session_token: "..." }, message: "..." }
        // We need to extract the session_token from response.data.data
        const responseData = response.data as any;

        console.log('SecureSDK: responseData keys:', Object.keys(responseData));
        console.log('SecureSDK: responseData.data:', responseData.data);
        console.log('SecureSDK: responseData.data keys:', responseData.data ? Object.keys(responseData.data) : 'undefined');

        // Fix: Return the session_token directly from the Laravel response structure
        if (responseData.data && responseData.data.session_token) {
          console.log('SecureSDK: Found session_token:', responseData.data.session_token);
          return { session_token: responseData.data.session_token };
        } else {
          console.error('SecureSDK: Could not find session_token in response');
          return responseData;
        }
      },

      verifyOTP: async (otp: string, sessionToken: string): Promise<{
        token: string;
        customer: Customer;
      }> => {
        const requestBody = {
          code: otp,
          session_token: sessionToken
        };
        console.log('SecureSDK: verifyOTP request body:', requestBody);
        const response = await this.http.post<ApiResponse<any>>('/auth/phone/verify', requestBody);
        console.log('🔍 SecureSDK: Raw API response before sanitization:', JSON.stringify(response.data, null, 2));
        console.log('🔍 SecureSDK: Extracted data (response.data.data):', JSON.stringify(response.data.data, null, 2));
        return (response.data as any).data || response.data;
      },

      resendOTP: async (sessionToken: string): Promise<void> => {
        const requestBody = {
          session_token: sessionToken
        };
        console.log('SecureSDK: resendOTP request body:', requestBody);
        await this.http.post<ApiResponse<any>>('/auth/phone/resend', requestBody);
      },

      completeRegistration: async (data: {
        firstName: string;
        lastName: string;
        email: string;
        sessionToken: string;
      }): Promise<{ token: string; customer: Customer }> => {
        const response = await this.http.post<ApiResponse<any>>('/auth/complete', {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          session_token: data.sessionToken
        });
        return (response.data as any).data || response.data;
      },

      getProfile: async (): Promise<Customer> => {
        const response = await this.http.get<ApiResponse<Customer>>('/customer/profile');
        return (response.data as any).data || response.data;
      },

      updateProfile: async (data: Partial<Customer>): Promise<Customer> => {
        const response = await this.http.patch<ApiResponse<Customer>>('/customer/profile', data);
        return (response.data as any).data || response.data;
      },

      logout: async (): Promise<void> => {
        await this.http.post('/customer/logout');
      }
    };
  }

  /**
   * Orders API (requires authentication)
   */
  get orders() {
    return {
      getAll: async (params?: { page?: number; per_page?: number }): Promise<{
        data: Order[];
        pagination?: any;
      }> => {
        const response = await this.http.get<ApiResponse<Order[]>>('/customer/orders', params);
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      },

      getById: async (id: number): Promise<Order> => {
        const response = await this.http.get<ApiResponse<Order>>(`/customer/orders/${id}`);
        return (response.data as any).data || response.data;
      },

      getCourses: async (): Promise<any[]> => {
        const response = await this.http.get<ApiResponse<any[]>>('/customer/courses');
        return (response.data as any).data || response.data;
      },

      getSubscriptions: async (): Promise<any[]> => {
        const response = await this.http.get<ApiResponse<any[]>>('/customer/subscriptions');
        return (response.data as any).data || response.data;
      },

      // Add submitReview for order reviews
      submitReview: async (orderId: number, reviewData: any): Promise<any> => {
        const response = await this.http.post<ApiResponse<any>>(`/orders/${orderId}/review`, reviewData);
        return (response.data as any).data || response.data;
      }
    };
  }

  /**
   * Checkout API
   */
  get checkout() {
    return {
      create: async (): Promise<{
        type: 'free_order' | 'payment_required';
        checkout_id?: string;
        checkout_url?: string;
        order_id?: number;
        amount?: number;
        redirect_url?: string;
      }> => {
        const response = await this.http.post<ApiResponse<any>>('/checkout');
        return (response.data as any).data || response.data;
      },

      getResult: async (sessionId: string): Promise<{
        status: string;
        order?: Order;
      }> => {
        const response = await this.http.get<ApiResponse<any>>(`/checkout/${sessionId}/result`);
        return (response.data as any).data || response.data;
      }
    };
  }

  /**
   * Wishlist API (requires authentication)
   */
  get wishlist() {
    return {
      get: async (): Promise<{ items: Product[]; count: number }> => {
        const response = await this.http.get<ApiResponse<any>>('/wishlist');
        return (response.data as any).data || response.data;
      },

      addItem: async (productId: number): Promise<void> => {
        await this.http.post('/wishlist', { product_id: productId });
      },

      removeItem: async (productId: number): Promise<void> => {
        await this.http.delete(`/wishlist/${productId}`);
      },

      check: async (productId: number): Promise<{ in_wishlist: boolean }> => {
        const response = await this.http.get<ApiResponse<any>>(`/wishlist/check/${productId}`);
        return (response.data as any).data || response.data;
      },

      clear: async (): Promise<void> => {
        await this.http.delete('/wishlist/clear');
      }
    };
  }

  /**
   * Reviews API
   */
  get reviews() {
    return {
      getAll: async (params?: {
        page?: number;
        per_page?: number;
        rating?: number;
      }): Promise<{ data: Review[]; pagination?: any }> => {
        const response = await this.http.get<ApiResponse<Review[]>>('/reviews', params);
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      },

      getRecent: async (limit = 6): Promise<Review[]> => {
        const response = await this.http.get<ApiResponse<Review[]>>('/reviews/recent', { limit });
        return (response.data as any).data || response.data;
      },

      submit: async (productId: number, data: {
        rating: number;
        comment: string;
      }): Promise<Review> => {
        const response = await this.http.post<ApiResponse<Review>>(`/products/${productId}/reviews`, data);
        return (response.data as any).data || response.data;
      },

      getStats: async (): Promise<any> => {
        const response = await this.http.get<ApiResponse<any>>('/reviews/stats');
        return (response.data as any).data || response.data;
      }
    };
  }

  /**
   * Components API (for homepage content)
   */
  get components() {
    return {
      getAll: async (): Promise<any[]> => {
        const response = await this.http.get<ApiResponse<any[]>>('/components');
        return (response.data as any).data || response.data;
      },

      getById: async (id: number): Promise<any> => {
        const response = await this.http.get<ApiResponse<any>>(`/components/${id}`);
        return (response.data as any).data || response.data;
      },

      getProducts: async (id: number, params?: {
        page?: number;
        per_page?: number;
      }): Promise<{ data: Product[]; pagination?: any }> => {
        const response = await this.http.get<ApiResponse<Product[]>>(`/components/${id}/products`, params);
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
    };
  }

  /**
   * Pages API
   */
  get pages() {
    return {
      getAll: async (): Promise<Page[]> => {
        const response = await this.http.get<ApiResponse<Page[]>>('/pages');
        return (response.data as any).data || response.data;
      },

      getByUrl: async (url: string): Promise<Page> => {
        const response = await this.http.get<ApiResponse<Page>>(`/pages/${url}`);
        return (response.data as any).data || response.data;
      }
    };
  }

  /**
   * Courses API (requires authentication)
   */
  get courses() {
    return {
      getAll: async (params?: { page?: number; per_page?: number }): Promise<{
        data: Course[];
        pagination?: any;
      }> => {
        const response = await this.http.get<ApiResponse<Course[]>>('/courses', params);
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      },

      getById: async (id: number): Promise<Course> => {
        const response = await this.http.get<ApiResponse<Course>>(`/courses/${id}`);
        return (response.data as any).data || response.data;
      },

      getProgress: async (courseId: number): Promise<CourseProgress> => {
        const response = await this.http.get<ApiResponse<CourseProgress>>(`/courses/${courseId}/progress`);
        return (response.data as any).data || response.data;
      },

      getModule: async (courseId: number, moduleId: number): Promise<CourseModule> => {
        const response = await this.http.get<ApiResponse<CourseModule>>(`/courses/${courseId}/modules/${moduleId}`);
        return (response.data as any).data || response.data;
      },

      completeModule: async (courseId: number, moduleId: number): Promise<{ success: boolean }> => {
        const response = await this.http.post<ApiResponse<any>>(`/courses/${courseId}/modules/${moduleId}/complete`);
        return (response.data as any).data || response.data;
      },

      // Legacy support for customer/courses endpoints
      getCustomerCourses: async (): Promise<Course[]> => {
        const response = await this.http.get<ApiResponse<Course[]>>('/customer/courses');
        return (response.data as any).data || response.data;
      },

      getCustomerCourse: async (id: number): Promise<Course> => {
        const response = await this.http.get<ApiResponse<Course>>(`/customer/courses/${id}`);
        return (response.data as any).data || response.data;
      },

      getCustomerCourseModule: async (courseId: number, moduleId: number): Promise<CourseModule> => {
        const response = await this.http.get<ApiResponse<CourseModule>>(`/customer/courses/${courseId}/modules/${moduleId}`);
        return (response.data as any).data || response.data;
      }
    };
  }

  /**
   * Management API (server-side only, requires secret key)
   */
  get management() {
    return {
      getAnalytics: async (params?: {
        start_date?: string;
        end_date?: string;
        metrics?: string[];
      }): Promise<any> => {
        const response = await this.http.get<ApiResponse<any>>('/management/analytics', params);
        return (response.data as any).data || response.data;
      },

      updateInventory: async (data: {
        product_id: number;
        quantity: number;
        operation?: 'set' | 'add' | 'subtract';
      }): Promise<{ success: boolean }> => {
        const response = await this.http.post<ApiResponse<any>>('/management/inventory/update', data);
        return (response.data as any).data || response.data;
      },

      getOrders: async (params?: {
        page?: number;
        per_page?: number;
        status?: string;
        date_from?: string;
        date_to?: string;
      }): Promise<{ data: Order[]; pagination?: any }> => {
        const response = await this.http.get<ApiResponse<Order[]>>('/management/orders', params);
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      },

      exportCustomers: async (params?: {
        format?: 'csv' | 'json';
        date_from?: string;
        date_to?: string;
      }): Promise<any> => {
        const response = await this.http.get<ApiResponse<any>>('/management/export/customers', params);
        return (response.data as any).data || response.data;
      },

      getWebhookData: async (params?: {
        type?: string;
        limit?: number;
      }): Promise<any[]> => {
        const response = await this.http.get<ApiResponse<any[]>>('/management/webhooks/data', params);
        return (response.data as any).data || response.data;
      }
    };
  }

  /**
   * Custom Token Management API (requires authentication)
   */
  get customTokens() {
    return {
      generateToken: async (data: {
        name: string;
        permissions: string[];
        expires_at?: string;
      }): Promise<{
        token: string;
        token_id: string;
        permissions: string[];
      }> => {
        const response = await this.http.post<ApiResponse<any>>('/custom/tokens', data);
        return (response.data as any).data || response.data;
      },

      listTokens: async (): Promise<Array<{
        id: string;
        name: string;
        permissions: string[];
        created_at: string;
        expires_at?: string;
        last_used_at?: string;
      }>> => {
        const response = await this.http.get<ApiResponse<any[]>>('/custom/tokens');
        return (response.data as any).data || response.data;
      },

      revokeToken: async (tokenId: string): Promise<{ success: boolean }> => {
        const response = await this.http.delete<ApiResponse<any>>(`/custom/tokens/${tokenId}`);
        return (response.data as any).data || response.data;
      },

      getTokenStats: async (tokenId: string): Promise<{
        requests_count: number;
        last_used_at?: string;
        endpoints_used: string[];
      }> => {
        const response = await this.http.get<ApiResponse<any>>(`/custom/tokens/${tokenId}/stats`);
        return (response.data as any).data || response.data;
      },

      validateToken: async (token: string): Promise<{
        valid: boolean;
        permissions: string[];
        expires_at?: string;
      }> => {
        const response = await this.http.post<ApiResponse<any>>('/custom/tokens/validate', { token });
        return (response.data as any).data || response.data;
      },

      getTokenPermissions: async (): Promise<{
        available_permissions: string[];
        permission_descriptions: Record<string, string>;
      }> => {
        const response = await this.http.get<ApiResponse<any>>('/custom/tokens/permissions');
        return (response.data as any).data || response.data;
      }
    };
  }

  /**
   * Utility Methods
   */

  // Build query parameters for products
  private buildProductParams(
    where?: { field: string; operator: string; value: any },
    orderField?: string,
    direction?: string,
    limit?: number
  ): Record<string, any> {
    const params: Record<string, any> = {};

    if (where) {
      if (where.field === 'featured' && where.operator === '=' && where.value) {
        params.featured = true;
      }
      if (where.field === 'category' && where.operator === '=') {
        params.category = where.value;
      }
      if (where.field === 'price' && where.operator === '>=') {
        params.price_min = where.value;
      }
      if (where.field === 'price' && where.operator === '<=') {
        params.price_max = where.value;
      }
    }

    if (orderField && direction) {
      params.sort = `${orderField}_${direction}`;
    }

    if (limit) {
      params.per_page = limit;
    }

    return params;
  }

  // Logging utility
  private log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      console.log(`[StorefrontSDK] ${message}`, data || '');
    }
  }

  /**
   * Get SDK information
   */
  getInfo(): {
    version: string;
    environment: typeof Environment.info;
    config: Omit<StorefrontConfig, 'secretKey'>;
  } {
    return {
      version: this.config.version,
      environment: Environment.info,
      config: {
        apiUrl: this.config.apiUrl,
        publicKey: this.config.publicKey,
        environment: this.config.environment,
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries,
        enableLogging: this.config.enableLogging
      }
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    try {
      await this.http.get('/health');
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Factory function for easy initialization
 */
export function createStorefrontSDK(config: StorefrontConfig): SecureStorefrontSDK {
  return SecureStorefrontSDK.createInstance(config);
}

/**
 * Framework-specific helpers
 */

// React Hook (if React is available)
export function useStorefrontSDK(config: StorefrontConfig) {
  if (typeof globalThis !== 'undefined' && (globalThis as any).window && (globalThis as any).window.React) {
    const React = (globalThis as any).window.React;
    return React.useMemo(() => createStorefrontSDK(config), [
      config.apiUrl,
      config.publicKey,
      config.environment
    ]);
  }
  return createStorefrontSDK(config);
}

// Vue composable (if Vue is available)
export function useStorefront(config: StorefrontConfig) {
  if (typeof globalThis !== 'undefined' && (globalThis as any).window && (globalThis as any).window.Vue) {
    const Vue = (globalThis as any).window.Vue;
    return Vue.computed(() => createStorefrontSDK(config));
  }
  return createStorefrontSDK(config);
}

// Export default for convenience
export default SecureStorefrontSDK;
