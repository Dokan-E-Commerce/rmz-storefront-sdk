import { BaseService } from './base.service';
import { Category, Product, PaginatedResponse } from '../types';

export class CategoriesService extends BaseService {
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await this.http.get<Category[]>('/categories');
    return response.data!;
  }

  /**
   * Get single category by slug
   */
  async getCategory(slug: string): Promise<Category> {
    const response = await this.http.get<Category>(`/categories/${slug}`);
    return response.data!;
  }

  /**
   * Get products in a category
   */
  async getCategoryProducts(
    slug: string, 
    filters?: {
      sort?: string;
      per_page?: number;
      page?: number;
    }
  ): Promise<PaginatedResponse<Product>> {
    const query = filters ? `?${new URLSearchParams(filters as any).toString()}` : '';
    const response = await this.http.get<Product[]>(`/categories/${slug}/products${query}`);
    return response as any;
  }
}