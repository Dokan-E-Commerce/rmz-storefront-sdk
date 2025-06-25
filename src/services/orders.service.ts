import { BaseService } from './base.service';
import { Order, PaginatedResponse } from '../types';

export class OrdersService extends BaseService {
  /**
   * Get customer orders (requires authentication)
   */
  async getOrders(page?: number, perPage?: number): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (perPage) params.append('per_page', perPage.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.http.get<Order[]>(`/customer/orders${query}`);
    return response as any;
  }

  /**
   * Get single order (requires authentication)
   */
  async getOrder(orderId: number): Promise<Order> {
    const response = await this.http.get<Order>(`/customer/orders/${orderId}`);
    return response.data!;
  }

  /**
   * Get customer subscriptions (requires authentication)
   */
  async getSubscriptions(): Promise<any[]> {
    const response = await this.http.get<any[]>('/customer/subscriptions');
    return response.data!;
  }

  /**
   * Get customer courses (requires authentication)
   */
  async getCourses(): Promise<any[]> {
    const response = await this.http.get<any[]>('/customer/courses');
    return response.data!;
  }

  /**
   * Get single course (requires authentication)
   */
  async getCourse(courseId: number): Promise<any> {
    const response = await this.http.get<any>(`/customer/courses/${courseId}`);
    return response.data!;
  }

  /**
   * Get course module (requires authentication)
   */
  async getCourseModule(courseId: number, moduleId: number): Promise<any> {
    const response = await this.http.get<any>(`/customer/courses/${courseId}/modules/${moduleId}`);
    return response.data!;
  }
}