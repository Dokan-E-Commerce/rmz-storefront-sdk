/**
 * Advanced Storefront Client - Firebase/Supabase Style
 * 
 * Complete abstraction layer for digital product stores
 */

import { EventEmitter } from 'events';
import { HttpClient, HttpClientConfig } from './utils/http-client';
import { AdvancedTable } from './advanced-sdk';

// Type definitions for all entities
interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_price?: number;
  currency: string;
  type: 'digital' | 'subscription' | 'course';
  status: 'active' | 'inactive' | 'draft';
  featured: boolean;
  stock_quantity?: number;
  sku?: string;
  images: Array<{
    id: number;
    url: string;
    alt?: string;
    primary: boolean;
  }>;
  categories: Category[];
  tags: string[];
  variants?: Array<{
    id: number;
    name: string;
    price: number;
    description?: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  sort_order: number;
  products_count: number;
  created_at: string;
  updated_at: string;
}

interface Cart {
  id: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  coupon?: {
    code: string;
    discount_amount: number;
    discount_type: 'percentage' | 'fixed';
  };
  created_at: string;
  updated_at: string;
}

interface CartItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  price: number;
  total: number;
  options?: Record<string, any>;
}

interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  customer: Customer;
  payment_method: string;
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  price: number;
  total: number;
  digital_codes?: string[];
  download_links?: string[];
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  product_id?: number;
  product?: Product;
  customer: Customer;
  type: 'product' | 'store';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface Store {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  domain: string;
  currency: string;
  timezone: string;
  settings: Record<string, any>;
  social_links?: Record<string, string>;
  contact_info?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// Specialized table classes with domain-specific methods
class ProductsTable extends AdvancedTable<Product> {
  constructor(client: HttpClient, eventEmitter: EventEmitter) {
    super('products', client, eventEmitter);
  }

  // Product-specific query methods
  byCategory(categorySlug: string) {
    return this.query().where('category_slug', 'eq', categorySlug);
  }

  featured() {
    return this.query().eq('featured', true);
  }

  inStock() {
    return this.query().where('stock_quantity', 'gt', 0);
  }

  byType(type: 'digital' | 'subscription' | 'course') {
    return this.query().eq('type', type);
  }

  search(term: string) {
    return this.query().ilike('name', `%${term}%`);
  }

  priceRange(min: number, max: number) {
    return this.query().gte('price', min).lte('price', max);
  }

  // Advanced product operations
  async getBySlug(slug: string) {
    return this.query().eq('slug', slug).include('categories,images,variants').single();
  }

  async getFeatured(limit = 10) {
    return this.featured().orderBy('created_at', 'desc').limit(limit).get();
  }

  async searchProducts(query: string, filters?: {
    category?: string;
    type?: string;
    priceMin?: number;
    priceMax?: number;
    inStock?: boolean;
  }) {
    let builder = this.search(query);
    
    if (filters?.category) {
      builder = builder.eq('category', filters.category);
    }
    
    if (filters?.type) {
      builder = builder.eq('type', filters.type);
    }
    
    if (filters?.priceMin !== undefined) {
      builder = builder.gte('price', filters.priceMin);
    }
    
    if (filters?.priceMax !== undefined) {
      builder = builder.lte('price', filters.priceMax);
    }
    
    if (filters?.inStock) {
      builder = builder.eq('in_stock', true);
    }
    
    return builder.include('categories,images').get();
  }

  async getRelated(productId: number, limit = 4) {
    const { data: product } = await this.findById(productId);
    if (!product || !product.categories.length) {
      return { data: [], error: null };
    }

    const categoryIds = product.categories.map(c => c.id);
    return this.query()
      .in('category_id', categoryIds)
      .neq('id', productId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();
  }
}

class CategoriesTable extends AdvancedTable<Category> {
  constructor(client: HttpClient, eventEmitter: EventEmitter) {
    super('categories', client, eventEmitter);
  }

  // Category-specific methods
  roots() {
    return this.query().eq('parent_id', null);
  }

  children(parentId: number) {
    return this.query().eq('parent_id', parentId);
  }

  async getBySlug(slug: string) {
    return this.query().eq('slug', slug).single();
  }

  async getHierarchy() {
    const { data: categories } = await this.query().orderBy('sort_order').get();
    
    // Build hierarchy
    const categoryMap = new Map();
    const roots: any[] = [];
    
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });
    
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id);
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children.push(category);
        }
      } else {
        roots.push(category);
      }
    });
    
    return { data: roots, error: null };
  }
}

class CartTable extends AdvancedTable<Cart> {
  constructor(client: HttpClient, eventEmitter: EventEmitter) {
    super('cart', client, eventEmitter);
  }

  async getCurrent() {
    try {
      const response = await this.client.get<Cart>('/storefront/cart');
      return { data: response.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async addItem(productId: number, quantity = 1, options?: Record<string, any>) {
    try {
      const response = await this.client.post<Cart>('/storefront/cart/add', {
        product_id: productId,
        qty: quantity,
        options
      });
      
      this.eventEmitter.emit('cart:item_added', { productId, quantity, options });
      
      return { data: response.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async updateItem(itemId: string, quantity: number) {
    try {
      const response = await this.client.patch<Cart>(`/storefront/cart/items/${itemId}`, {
        quantity
      });
      
      this.eventEmitter.emit('cart:item_updated', { itemId, quantity });
      
      return { data: response.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async removeItem(itemId: string) {
    try {
      const response = await this.client.delete<Cart>(`/storefront/cart/items/${itemId}`);
      
      this.eventEmitter.emit('cart:item_removed', { itemId });
      
      return { data: response.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async clear() {
    try {
      const response = await this.client.delete<Cart>('/storefront/cart/clear');
      
      this.eventEmitter.emit('cart:cleared');
      
      return { data: response.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async applyCoupon(code: string) {
    try {
      const response = await this.client.post<Cart>('/storefront/cart/coupon', { code });
      
      this.eventEmitter.emit('cart:coupon_applied', { code });
      
      return { data: response.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async removeCoupon() {
    try {
      const response = await this.client.delete<Cart>('/storefront/cart/coupon');
      
      this.eventEmitter.emit('cart:coupon_removed');
      
      return { data: response.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
}

class OrdersTable extends AdvancedTable<Order> {
  constructor(client: HttpClient, eventEmitter: EventEmitter) {
    super('orders', client, eventEmitter);
  }

  // Customer's orders
  mine() {
    return this.query().orderBy('created_at', 'desc');
  }

  byStatus(status: Order['status']) {
    return this.query().eq('status', status);
  }

  recent(limit = 10) {
    return this.mine().limit(limit);
  }

  async getByNumber(orderNumber: string) {
    return this.query().eq('order_number', orderNumber).include('items,items.product').single();
  }
}

class ReviewsTable extends AdvancedTable<Review> {
  constructor(client: HttpClient, eventEmitter: EventEmitter) {
    super('reviews', client, eventEmitter);
  }

  approved() {
    return this.query().eq('status', 'approved');
  }

  forProduct(productId: number) {
    return this.approved().eq('product_id', productId);
  }

  forStore() {
    return this.approved().eq('type', 'store');
  }

  byRating(rating: number) {
    return this.query().eq('rating', rating);
  }

  recent(limit = 10) {
    return this.approved().orderBy('created_at', 'desc').limit(limit);
  }

  async getStats() {
    try {
      const response = await this.client.get('/storefront/reviews/stats');
      return { data: response.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async submit(data: {
    product_id?: number;
    rating: number;
    comment: string;
    type: 'product' | 'store';
  }) {
    try {
      const endpoint = data.type === 'product' 
        ? `/storefront/products/${data.product_id}/reviews`
        : '/storefront/reviews';
        
      const response = await this.client.post<Review>(endpoint, data);
      
      this.eventEmitter.emit('review:submitted', data);
      
      return { data: response.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
}

// Main Storefront Client
export class StorefrontClient extends EventEmitter {
  private http: HttpClient;
  
  // Table instances
  public products: ProductsTable;
  public categories: CategoriesTable;
  public cart: CartTable;
  public orders: OrdersTable;
  public reviews: ReviewsTable;
  public store: AdvancedTable<Store>;
  public customers: AdvancedTable<Customer>;

  // Authentication state
  private authToken?: string;
  private currentUser?: Customer;

  constructor(config: HttpClientConfig) {
    super();
    
    this.http = new HttpClient(config);
    
    // Initialize tables
    this.products = new ProductsTable(this.http, this);
    this.categories = new CategoriesTable(this.http, this);
    this.cart = new CartTable(this.http, this);
    this.orders = new OrdersTable(this.http, this);
    this.reviews = new ReviewsTable(this.http, this);
    this.store = new AdvancedTable<Store>('store', this.http, this);
    this.customers = new AdvancedTable<Customer>('customers', this.http, this);

    // Auto-restore auth token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        this.setAuthToken(token);
      }
    }
  }

  // Authentication methods
  setAuthToken(token: string) {
    this.authToken = token;
    this.http.setAuthToken(token);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
    
    this.emit('auth:token_set', { token });
  }

  clearAuth() {
    this.authToken = undefined;
    this.currentUser = undefined;
    this.http.clearAuthToken();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    
    this.emit('auth:cleared');
  }

  async getCurrentUser() {
    if (!this.authToken) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      const response = await this.http.get<Customer>('/storefront/customer/profile');
      this.currentUser = response.data!;
      this.emit('auth:user_loaded', { user: this.currentUser });
      return { data: this.currentUser, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Store methods
  async getStore() {
    try {
      const response = await this.http.get<Store>('/storefront/store');
      return { data: response.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Real-time features
  enableRealtime() {
    // This would connect to WebSocket or Server-Sent Events
    // For now, we'll use polling simulation
    console.log('Real-time features enabled');
    this.emit('realtime:connected');
  }

  disableRealtime() {
    console.log('Real-time features disabled');
    this.emit('realtime:disconnected');
  }

  // Utility methods
  formatPrice(amount: number, currency = 'SAR') {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString();
  }

  // Cache management
  clearAllCaches() {
    this.products.clearCache();
    this.categories.clearCache();
    this.orders.clearCache();
    this.reviews.clearCache();
    this.store.clearCache();
    this.customers.clearCache();
    
    this.emit('cache:cleared');
  }

  getCacheStats() {
    return {
      products: this.products.getCacheStats(),
      categories: this.categories.getCacheStats(),
      orders: this.orders.getCacheStats(),
      reviews: this.reviews.getCacheStats(),
      store: this.store.getCacheStats(),
      customers: this.customers.getCacheStats()
    };
  }
}

// Factory function
export function createStorefrontClient(config: HttpClientConfig): StorefrontClient {
  return new StorefrontClient(config);
}

// Export types
export type {
  Product,
  Category,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Customer,
  Review,
  Store
};