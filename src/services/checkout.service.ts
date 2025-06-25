import { BaseService } from './base.service';
import { ApiResponse } from '../types';

export interface CheckoutRequest {
  email?: string;
  phone?: string;
  customer_id?: number;
  shipping_address?: ShippingAddress;
  billing_address?: BillingAddress;
  payment_method: string;
  payment_details?: Record<string, any>;
  notes?: string;
  agree_to_terms?: boolean;
  subscribe_to_newsletter?: boolean;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone?: string;
}

export interface BillingAddress extends ShippingAddress {
  company?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'wallet' | 'other';
  icon?: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface CheckoutSession {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  order_id?: number;
  payment_url?: string;
  redirect_url?: string;
  expires_at: string;
}

export class CheckoutService extends BaseService {
  /**
   * Get available payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await this.http.get<PaymentMethod[]>('/checkout/payment-methods');
    return response.data!;
  }

  /**
   * Calculate shipping cost
   */
  async calculateShipping(address: ShippingAddress): Promise<{ cost: number; methods: any[] }> {
    const response = await this.http.post<{ cost: number; methods: any[] }>('/checkout/shipping', address);
    return response.data!;
  }

  /**
   * Validate checkout data before processing
   */
  async validateCheckout(data: CheckoutRequest): Promise<{ valid: boolean; errors?: Record<string, string[]> }> {
    const response = await this.http.post<any>('/checkout/validate', data);
    return {
      valid: response.success,
      errors: response.errors
    };
  }

  /**
   * Process checkout
   */
  async processCheckout(data: CheckoutRequest): Promise<CheckoutSession> {
    const response = await this.http.post<CheckoutSession>('/checkout', data);
    
    // Clear cart token after successful checkout
    if (response.success) {
      this.http.clearCartToken();
    }
    
    return response.data!;
  }

  /**
   * Get checkout session status
   */
  async getCheckoutSession(sessionId: string): Promise<CheckoutSession> {
    const response = await this.http.get<CheckoutSession>(`/checkout/session/${sessionId}`);
    return response.data!;
  }

  /**
   * Apply gift card to checkout
   */
  async applyGiftCard(code: string): Promise<{ applied: boolean; balance: number; discount: number }> {
    const response = await this.http.post<any>('/checkout/gift-card', { code });
    return response.data!;
  }

  /**
   * Remove gift card from checkout
   */
  async removeGiftCard(code: string): Promise<void> {
    await this.http.delete(`/checkout/gift-card/${code}`);
  }

  /**
   * Get tax calculation
   */
  async calculateTax(address: BillingAddress): Promise<{ rate: number; amount: number }> {
    const response = await this.http.post<{ rate: number; amount: number }>('/checkout/tax', address);
    return response.data!;
  }

  /**
   * Create guest checkout session
   */
  async createGuestSession(email: string): Promise<{ session_token: string }> {
    const response = await this.http.post<{ session_token: string }>('/checkout/guest', { email });
    return response.data!;
  }

  /**
   * Complete payment callback (for payment gateways that redirect back)
   */
  async completePayment(sessionId: string, paymentData: Record<string, any>): Promise<CheckoutSession> {
    const response = await this.http.post<CheckoutSession>(`/checkout/complete/${sessionId}`, paymentData);
    return response.data!;
  }
}