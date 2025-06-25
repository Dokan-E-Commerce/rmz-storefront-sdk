import { BaseService } from './base.service';
import { 
  AuthInitiateRequest, 
  AuthVerifyRequest, 
  AuthCompleteRequest, 
  AuthResponse, 
  Customer 
} from '../types';

export class AuthService extends BaseService {
  /**
   * Initiate authentication process
   */
  async initiate(request: AuthInitiateRequest): Promise<{ session_token: string }> {
    const response = await this.http.post<{ session_token: string }>('/auth/start', request);
    return response.data!;
  }

  /**
   * Start phone authentication
   */
  async startAuth(request: { type: 'phone'; country_code: string; phone: string } | { type: 'email'; email: string }): Promise<{ session_token: string }> {
    const response = await this.http.post<{ session_token: string }>('/auth/start', request);
    return response.data!;
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(request: AuthVerifyRequest): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/auth/verify', request);
    
    // If authenticated, store the token
    if (response.data?.token) {
      this.http.setAuthToken(response.data.token);
    }
    
    return response.data!;
  }

  /**
   * Resend OTP code
   */
  async resendOTP(): Promise<void> {
    await this.http.post('/auth/resend');
  }

  /**
   * Complete registration for new customers
   */
  async completeRegistration(request: AuthCompleteRequest): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/auth/complete', request);
    
    // If authenticated, store the token
    if (response.data?.token) {
      this.http.setAuthToken(response.data.token);
    }
    
    return response.data!;
  }

  /**
   * Get current customer profile (requires authentication)
   */
  async getProfile(): Promise<Customer> {
    const response = await this.http.get<Customer>('/customer/profile');
    return response.data!;
  }

  /**
   * Update customer profile (requires authentication)
   */
  async updateProfile(data: Partial<Customer>): Promise<Customer> {
    const response = await this.http.patch<Customer>('/customer/profile', data);
    return response.data!;
  }

  /**
   * Logout current customer
   */
  async logout(): Promise<void> {
    try {
      await this.http.post('/customer/logout');
    } finally {
      this.http.clearAuthToken();
    }
  }

  /**
   * Set authentication token (for restoring sessions)
   */
  setAuthToken(token: string) {
    this.http.setAuthToken(token);
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.http.clearAuthToken();
  }
}