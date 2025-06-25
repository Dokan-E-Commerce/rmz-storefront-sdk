import { BaseService } from './base.service';
import { Cart, Product, SubscriptionVariant } from '../types';

export interface AddToCartRequest {
  product_id: number;
  qty: number;
  notice?: string;
  subscription_plan?: SubscriptionVariant;
  fields?: Record<string, string>;
}

export interface CartSummary extends Cart {
  payment_methods?: any[];
  shipping?: {
    required: boolean;
    cost: number;
  };
  tax?: {
    rate: number;
    amount: number;
  };
}

export class CartService extends BaseService {
  /**
   * Get cart contents
   */
  async getCart(): Promise<Cart> {
    const response = await this.http.get<Cart>('/cart');
    
    // Store cart token if returned
    if (response.data?.cart_token) {
      this.http.setCartToken(response.data.cart_token);
    }
    
    return response.data!;
  }

  /**
   * Add product to cart
   */
  async addToCart(request: AddToCartRequest): Promise<Cart> {
    const response = await this.http.post<Cart>('/cart/add', request);
    
    // Store cart token if returned
    if (response.data?.cart_token) {
      this.http.setCartToken(response.data.cart_token);
    }
    
    return response.data!;
  }

  /**
   * Update cart item quantity
   */
  async updateQuantity(productId: number, quantity: number): Promise<Cart> {
    const response = await this.http.patch<Cart>(`/cart/items/${productId}`, { quantity });
    return response.data!;
  }

  /**
   * Remove item from cart
   */
  async removeItem(productId: number): Promise<Cart> {
    const response = await this.http.delete<Cart>(`/cart/items/${productId}`);
    return response.data!;
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<Cart> {
    const response = await this.http.delete<Cart>('/cart/clear');
    return response.data!;
  }

  /**
   * Get cart count
   */
  async getCartCount(): Promise<{ count: number; cart_token: string }> {
    const response = await this.http.get<{ count: number; cart_token: string }>('/cart/count');
    
    // Store cart token if returned
    if (response.data?.cart_token) {
      this.http.setCartToken(response.data.cart_token);
    }
    
    return response.data!;
  }

  /**
   * Apply coupon to cart
   */
  async applyCoupon(couponCode: string): Promise<Cart> {
    const response = await this.http.post<Cart>('/cart/coupon', { coupon: couponCode });
    return response.data!;
  }

  /**
   * Remove coupon from cart
   */
  async removeCoupon(): Promise<Cart> {
    const response = await this.http.delete<Cart>('/cart/coupon');
    return response.data!;
  }

  /**
   * Validate cart before checkout
   */
  async validateCart(): Promise<{ valid: boolean; errors?: string[] }> {
    const response = await this.http.get<Cart>('/cart/validate');
    return {
      valid: response.success,
      errors: response.errors ? Object.values(response.errors).flat() : undefined
    };
  }

  /**
   * Get cart summary for checkout
   */
  async getCartSummary(): Promise<CartSummary> {
    const response = await this.http.get<CartSummary>('/cart/summary');
    return response.data!;
  }

  /**
   * Set cart token (for restoring carts)
   */
  setCartToken(token: string) {
    this.http.setCartToken(token);
  }

  /**
   * Clear cart token
   */
  clearCartToken() {
    this.http.clearCartToken();
  }
}