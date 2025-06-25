import { BaseService } from './base.service';
import { Store, Currency } from '../types';

export class StoreService extends BaseService {
  /**
   * Get store information
   */
  async getStore(): Promise<Store> {
    const response = await this.http.get<Store>('/store');
    return response.data!;
  }

  /**
   * Get available currencies
   */
  async getCurrencies(): Promise<Currency[]> {
    const response = await this.http.get<Currency[]>('/store/currency');
    return response.data!;
  }

  /**
   * Change active currency
   */
  async changeCurrency(symbol: string): Promise<void> {
    await this.http.post('/store/currency', { symbol });
  }

  /**
   * Get store settings
   */
  async getSettings(): Promise<Record<string, any>> {
    const response = await this.http.get<Record<string, any>>('/store/settings');
    return response.data!;
  }

  /**
   * Get store features
   */
  async getFeatures(): Promise<string[]> {
    const response = await this.http.get<string[]>('/store/features');
    return response.data!;
  }

  /**
   * Get store banners
   */
  async getBanners(): Promise<any[]> {
    const response = await this.http.get<any[]>('/store/banners');
    return response.data!;
  }
}