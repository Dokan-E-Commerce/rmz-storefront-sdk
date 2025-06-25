/**
 * Environment Detection and Configuration
 * Secure environment handling for client/server-side compatibility
 */
interface EnvironmentInfo {
    isServer: boolean;
    isBrowser: boolean;
    isWebWorker: boolean;
    isNode: boolean;
    platform: 'browser' | 'node' | 'webworker' | 'unknown';
}
declare class Environment {
    private static _info;
    static get info(): EnvironmentInfo;
    private static detect;
    /**
     * Get environment variables securely
     * Only works server-side for security
     */
    static getEnvVar(key: string): string | undefined;
    /**
     * Check if we can use secure features
     */
    static canUseSecureFeatures(): boolean;
    /**
     * Get secure crypto implementation
     */
    static getCrypto(): any;
    /**
     * Check if fetch is available
     */
    static hasFetch(): boolean;
    /**
     * Get appropriate HTTP client
     */
    static getHttpClient(): any;
}

/**
 * Secure Storefront SDK - Framework Agnostic
 * Works with any JavaScript framework: React, Vue, Angular, Svelte, Vanilla JS
 * Supports both client-side and server-side environments
 */

interface StorefrontConfig {
    apiUrl: string;
    publicKey: string;
    secretKey?: string;
    environment?: 'production' | 'development';
    version?: string;
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
    enableLogging?: boolean;
}
interface ApiResponse<T = any> {
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
interface Product {
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
interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image?: string;
}
interface Cart {
    items: CartItem[];
    count: number;
    subtotal: number;
    total: number;
    currency: string;
}
interface CartItem {
    id: number;
    product_id: number;
    product: Product;
    quantity: number;
    price: number;
    total: number;
}
interface Store {
    id: number;
    name: string;
    description?: string;
    logo?: string;
    currency: string;
    settings?: Record<string, any>;
}
interface Customer {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
}
interface Order {
    id: number;
    status: string;
    items: OrderItem[];
    total: number;
    created_at: string;
}
interface OrderItem {
    id: number;
    product: Product;
    quantity: number;
    price: number;
}
interface Review {
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
/**
 * Main Storefront SDK Class
 * Framework-agnostic with client/server-side support
 */
declare class SecureStorefrontSDK {
    private config;
    private security;
    private http;
    private static instances;
    constructor(config: StorefrontConfig);
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
    /**
     * Create singleton instance (recommended for most use cases)
     */
    static createInstance(config: StorefrontConfig): SecureStorefrontSDK;
    /**
     * Store API
     */
    get store(): {
        get: (params?: {
            include?: string[];
        }) => Promise<Store>;
        getCurrencies: () => Promise<Array<{
            code: string;
            symbol: string;
            name: string;
        }>>;
        changeCurrency: (currency: string) => Promise<void>;
        getSettings: () => Promise<Record<string, any>>;
        getFeatures: () => Promise<Array<{
            id: number;
            title: string;
            description: string;
            icon: string;
            sort_order: number;
        }>>;
        getBanners: () => Promise<Array<{
            id: number;
            title: string;
            description: string;
            image_url: string;
            link_url: string;
            sort_order: number;
        }>>;
    };
    /**
     * Products API with Firebase/Supabase-style query builder
     */
    get products(): {
        where: (field: string, operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "like", value: any) => {
            orderBy: (orderField: string, direction?: "asc" | "desc") => {
                limit: (count: number) => {
                    get: () => Promise<Product[]>;
                };
                get: () => Promise<Product[]>;
            };
            get: () => Promise<Product[]>;
        };
        getAll: (params?: {
            page?: number;
            per_page?: number;
            search?: string;
            category?: string;
            sort?: string;
        }) => Promise<{
            data: Product[];
            pagination?: any;
        }>;
        getById: (id: number) => Promise<Product>;
        getBySlug: (slug: string) => Promise<Product>;
        search: (query: string, options?: {
            category?: string;
            price_min?: number;
            price_max?: number;
            per_page?: number;
        }) => Promise<{
            data: Product[];
            pagination?: any;
        }>;
        getFeatured: (limit?: number) => Promise<Product[]>;
        getRelated: (productId: number, limit?: number) => Promise<Product[]>;
        getReviews: (productId: number, params?: {
            page?: number;
            per_page?: number;
        }) => Promise<{
            data: Review[];
            pagination?: any;
        }>;
    };
    /**
     * Categories API
     */
    get categories(): {
        getAll: () => Promise<Category[]>;
        getById: (id: number) => Promise<Category>;
        getBySlug: (slug: string) => Promise<Category>;
        getProducts: (slug: string, params?: {
            page?: number;
            per_page?: number;
            sort?: string;
        }) => Promise<{
            data: Product[];
            pagination?: any;
        }>;
    };
    /**
     * Helper method to handle cart token from response
     */
    private handleCartResponse;
    /**
     * Cart API
     */
    get cart(): {
        get: () => Promise<Cart>;
        addItem: (productId: number, quantity?: number, options?: {
            fields?: Record<string, any>;
            notice?: string;
        }) => Promise<Cart>;
        updateItem: (itemId: string, quantity: number) => Promise<Cart>;
        removeItem: (itemId: string) => Promise<Cart>;
        clear: () => Promise<void>;
        getCount: () => Promise<number>;
        applyCoupon: (code: string) => Promise<Cart>;
        removeCoupon: () => Promise<Cart>;
    };
    /**
     * Authentication API (client-side compatible)
     */
    get auth(): {
        startPhoneAuth: (phone: string, countryCode: string) => Promise<{
            session_token: string;
        }>;
        verifyOTP: (otp: string, sessionToken: string) => Promise<{
            token: string;
            customer: Customer;
        }>;
        resendOTP: (sessionToken: string) => Promise<void>;
        completeRegistration: (data: {
            firstName: string;
            lastName: string;
            email: string;
            sessionToken: string;
        }) => Promise<{
            token: string;
            customer: Customer;
        }>;
        getProfile: () => Promise<Customer>;
        updateProfile: (data: Partial<Customer>) => Promise<Customer>;
        logout: () => Promise<void>;
    };
    /**
     * Orders API (requires authentication)
     */
    get orders(): {
        getAll: (params?: {
            page?: number;
            per_page?: number;
        }) => Promise<{
            data: Order[];
            pagination?: any;
        }>;
        getById: (id: number) => Promise<Order>;
        getCourses: () => Promise<any[]>;
    };
    /**
     * Checkout API
     */
    get checkout(): {
        create: () => Promise<{
            type: "free_order" | "payment_required";
            checkout_id?: string;
            checkout_url?: string;
            order_id?: number;
            amount?: number;
            redirect_url?: string;
        }>;
        getResult: (sessionId: string) => Promise<{
            status: string;
            order?: Order;
        }>;
    };
    /**
     * Wishlist API (requires authentication)
     */
    get wishlist(): {
        get: () => Promise<{
            items: Product[];
            count: number;
        }>;
        addItem: (productId: number) => Promise<void>;
        removeItem: (productId: number) => Promise<void>;
        check: (productId: number) => Promise<{
            in_wishlist: boolean;
        }>;
        clear: () => Promise<void>;
    };
    /**
     * Reviews API
     */
    get reviews(): {
        getAll: (params?: {
            page?: number;
            per_page?: number;
            rating?: number;
        }) => Promise<{
            data: Review[];
            pagination?: any;
        }>;
        getRecent: (limit?: number) => Promise<Review[]>;
        submit: (productId: number, data: {
            rating: number;
            comment: string;
        }) => Promise<Review>;
        getStats: () => Promise<any>;
    };
    /**
     * Components API (for homepage content)
     */
    get components(): {
        getAll: () => Promise<any[]>;
    };
    /**
     * Utility Methods
     */
    private buildProductParams;
    private log;
    /**
     * Get SDK information
     */
    getInfo(): {
        version: string;
        environment: typeof Environment.info;
        config: Omit<StorefrontConfig, 'secretKey'>;
    };
    /**
     * Health check
     */
    healthCheck(): Promise<{
        status: 'ok' | 'error';
        message?: string;
    }>;
}
/**
 * Factory function for easy initialization
 */
declare function createStorefrontSDK(config: StorefrontConfig): SecureStorefrontSDK;
/**
 * Framework-specific helpers
 */
declare function useStorefrontSDK(config: StorefrontConfig): any;
declare function useStorefront(config: StorefrontConfig): any;

export { type ApiResponse as A, type Category as C, Environment as E, type Order as O, type Product as P, type Review as R, SecureStorefrontSDK as S, useStorefront as a, type StorefrontConfig as b, createStorefrontSDK as c, type Cart as d, type CartItem as e, type OrderItem as f, type Customer as g, type Store as h, useStorefrontSDK as u };
