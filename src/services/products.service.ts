import { BaseService } from './base.service';
import { Product, Review, PaginatedResponse, SubscriptionVariant } from '../types';

export interface ProductsFilter {
  category?: string;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc';
  per_page?: number;
  page?: number;
  featured?: boolean;
  type?: 'digital' | 'subscription' | 'course';
}

export interface ProductSearchFilter extends ProductsFilter {
  q: string;
  price_min?: number;
  price_max?: number;
}

export class ProductsService extends BaseService {
  /**
   * Get products list with filters
   */
  async getProducts(filters?: ProductsFilter): Promise<PaginatedResponse<Product>> {
    const query = filters ? `?${new URLSearchParams(filters as any).toString()}` : '';
    const response = await this.http.get<Product[]>(`/products${query}`);
    return response as any; // Type assertion since API returns paginated response
  }

  /**
   * Get single product by slug
   */
  async getProduct(slug: string): Promise<Product> {
    const response = await this.http.get<Product>(`/products/${slug}`);
    return response.data!;
  }

  /**
   * Get product reviews
   */
  async getProductReviews(productId: number, page?: number, perPage?: number): Promise<PaginatedResponse<Review>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (perPage) params.append('per_page', perPage.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.http.get<Review[]>(`/products/${productId}/reviews${query}`);
    return response as any;
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    const query = limit ? `?limit=${limit}` : '';
    const response = await this.http.get<Product[]>(`/featured-products${query}`);
    return response.data!;
  }

  /**
   * Submit product review (requires authentication)
   */
  async submitReview(productId: number, rating: number, comment: string): Promise<Review> {
    const response = await this.http.post<Review>(`/products/${productId}/reviews`, {
      rating,
      comment
    });
    return response.data!;
  }

  /**
   * Get customer's review for a product (requires authentication)
   */
  async getCustomerReview(productId: number): Promise<Review | null> {
    try {
      const response = await this.http.get<Review>(`/customer/reviews/${productId}`);
      return response.data!;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get product variants (for subscription products)
   */
  async getProductVariants(productId: number): Promise<SubscriptionVariant[]> {
    const response = await this.http.get<SubscriptionVariant[]>(`/products/${productId}/variants`);
    return response.data!;
  }

  /**
   * Get related products
   */
  async getRelatedProducts(productId: number, limit?: number): Promise<Product[]> {
    const query = limit ? `?limit=${limit}` : '';
    const response = await this.http.get<Product[]>(`/products/${productId}/related${query}`);
    return response.data!;
  }

  /**
   * Search products with advanced filters
   */
  async searchProducts(filters: ProductSearchFilter): Promise<PaginatedResponse<Product>> {
    const query = `?${new URLSearchParams(filters as any).toString()}`;
    const response = await this.http.get<Product[]>(`/products/search${query}`);
    return response as any;
  }
}