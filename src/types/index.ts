// Common Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    has_more_pages: boolean;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
}

// Store Types
export interface Store {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  favicon?: string;
  settings?: Record<string, any>;
  features?: string[];
  currencies?: Currency[];
  payment_methods?: PaymentMethod[];
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
  is_default: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon?: string;
  enabled: boolean;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  type: 'digital' | 'subscription' | 'course';
  status: number;
  price: Price;
  stock?: Stock;
  image?: ProductImage;
  categories?: Category[];
  tags?: string[];
  fields?: CustomField[];
  subscription_variants?: SubscriptionVariant[];
  codes?: ProductCode[];
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Price {
  original: number;
  actual: number;
  discount?: number;
  formatted: string;
  currency: string;
}

export interface Stock {
  available: number;
  unlimited: boolean;
  min_qty: number;
  codes_count?: number;
}

export interface ProductImage {
  id: number;
  url?: string;
  path?: string;
  filename?: string;
  alt?: string;
}

export interface CustomField {
  name: string;
  type: 'text' | 'textarea' | 'select';
  required: boolean;
  options?: Record<string, { name: string; price?: number }>;
}

export interface SubscriptionVariant {
  id: number;
  duration: number;
  price: number;
  formatted_price: string;
}

export interface ProductCode {
  id: number;
  code: string;
  is_sold: boolean;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  products_count?: number;
}

// Customer Types
export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country_code: string;
  created_at: string;
}

// Cart Types
export interface Cart {
  cart_token: string;
  items: CartItem[];
  count: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  coupon?: Coupon;
  currency: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  slug: string;
  image?: ProductImage;
  quantity: number;
  unit_price: number;
  total_price: number;
  custom_fields?: Record<string, string>;
  subscription_plan?: SubscriptionVariant;
  notice?: string;
  product: Product;
}

export interface Coupon {
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
}

// Order Types
export interface Order {
  id: number;
  order_number: string;
  status: {
    id: number;
    status: number;
    name: string;
    color: string;
    human_format: {
      text: string;
      color: string;
      date_human: string;
      date_normal: string;
    };
  };
  statuses?: Array<{
    id: number;
    status: number;
    name: string;
    color: string;
    created_at: string;
    human_format: {
      text: string;
      color: string;
      date_human: string;
      date_normal: string;
    };
  }>;
  status_id: number;
  total: number | {
    amount: number;
    formatted: string;
    currency: string;
  };
  formatted_total: string;
  items: OrderItem[];
  created_at: string;
  payment_method?: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  codes?: string[];
}

// Review Types
export interface Review {
  id: number;
  rating: number;
  comment: string;
  reviewer: {
    id: number;
    name: string;
  };
  created_at: string;
  is_published: boolean;
}

// Page Types
export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
}

// Auth Types
export interface AuthInitiateRequest {
  type: 'phone' | 'email';
  country_code?: string;
  phone?: string;
  email?: string;
}

export interface AuthVerifyRequest {
  otp: string;
  session_token: string;
}

export interface AuthCompleteRequest {
  initData: {
    email: string;
    first_name: string;
    last_name: string;
  };
  session_token: string;
}

export interface AuthResponse {
  type: 'authenticated' | 'new' | 'registered';
  token?: string;
  customer?: Customer;
  requires_registration?: boolean;
  session_token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface OTPRequest {
  type: 'phone' | 'email';
  phone?: string;
  email?: string;
}

export interface VerifyOTPRequest {
  session_token: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ProductVariant {
  id: number;
  name: string;
  price: number;
  stock?: number;
}

// Wishlist Types
export interface WishlistResponse {
  items: Product[];
  count: number;
}

// Checkout Types
export interface CheckoutRequest {
  payment_method: string;
  billing_address?: Address;
  shipping_address?: Address;
  notes?: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  country: string;
  postal_code: string;
}

export interface CheckoutResponse {
  id: number;
  order_id: number;
  payment_url?: string;
  redirect_url?: string;
  status: string;
}
