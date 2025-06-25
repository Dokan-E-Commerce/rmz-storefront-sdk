import { BaseService } from './base.service';
import { Product, WishlistResponse } from '../types';

export class WishlistService extends BaseService {
  /**
   * Get wishlist items (requires authentication)
   */
  async getWishlist(): Promise<WishlistResponse> {
    const response = await this.http.get<WishlistResponse>('/wishlist');
    return response.data!;
  }

  /**
   * Add product to wishlist (requires authentication)
   */
  async addToWishlist(productId: number): Promise<void> {
    await this.http.post('/wishlist', { product_id: productId });
  }

  /**
   * Remove product from wishlist (requires authentication)
   */
  async removeFromWishlist(productId: number): Promise<void> {
    await this.http.delete(`/wishlist/${productId}`);
  }

  /**
   * Check if product is in wishlist (requires authentication)
   */
  async checkWishlist(productId: number): Promise<boolean> {
    const response = await this.http.get<{ in_wishlist: boolean }>(`/wishlist/check/${productId}`);
    return response.data?.in_wishlist || false;
  }

  /**
   * Get wishlist count (requires authentication)
   */
  async getWishlistCount(): Promise<number> {
    const response = await this.http.get<{ count: number }>('/wishlist/count');
    return response.data?.count || 0;
  }

  /**
   * Clear entire wishlist (requires authentication)
   */
  async clearWishlist(): Promise<void> {
    await this.http.delete('/wishlist/clear');
  }
}