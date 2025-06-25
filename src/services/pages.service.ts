import { BaseService } from './base.service';

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  featured_image?: {
    url: string;
    alt?: string;
  };
  status: 'published' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  title: string;
  url: string;
  target?: '_blank' | '_self';
  children?: MenuItem[];
}

export interface Menu {
  name: string;
  items: MenuItem[];
}

export interface ContactForm {
  name: string;
  email: string;
  subject?: string;
  message: string;
  phone?: string;
  company?: string;
}

export class PagesService extends BaseService {
  /**
   * Get all published pages
   */
  async getPages(): Promise<Page[]> {
    const response = await this.http.get<Page[]>('/pages');
    return response.data!;
  }

  /**
   * Get single page by slug
   */
  async getPage(slug: string): Promise<Page> {
    const response = await this.http.get<Page>(`/pages/${slug}`);
    return response.data!;
  }

  /**
   * Get menu by name
   */
  async getMenu(name: string): Promise<Menu> {
    const response = await this.http.get<Menu>(`/menus/${name}`);
    return response.data!;
  }

  /**
   * Get all menus
   */
  async getMenus(): Promise<Record<string, Menu>> {
    const response = await this.http.get<Record<string, Menu>>('/menus');
    return response.data!;
  }

  /**
   * Submit contact form
   */
  async submitContactForm(data: ContactForm): Promise<{ success: boolean; message: string }> {
    const response = await this.http.post<{ success: boolean; message: string }>('/contact', data);
    return response.data!;
  }

  /**
   * Subscribe to newsletter
   */
  async subscribeNewsletter(email: string, tags?: string[]): Promise<{ success: boolean; message: string }> {
    const response = await this.http.post<{ success: boolean; message: string }>('/newsletter/subscribe', {
      email,
      tags
    });
    return response.data!;
  }

  /**
   * Unsubscribe from newsletter
   */
  async unsubscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
    const response = await this.http.post<{ success: boolean; message: string }>('/newsletter/unsubscribe', {
      email
    });
    return response.data!;
  }

  /**
   * Search pages
   */
  async searchPages(query: string): Promise<Page[]> {
    const response = await this.http.get<Page[]>(`/pages/search?q=${encodeURIComponent(query)}`);
    return response.data!;
  }

  /**
   * Get site settings/configuration
   */
  async getSiteSettings(): Promise<Record<string, any>> {
    const response = await this.http.get<Record<string, any>>('/settings');
    return response.data!;
  }

  /**
   * Get FAQ items
   */
  async getFAQs(): Promise<Array<{ question: string; answer: string; category?: string }>> {
    const response = await this.http.get<Array<{ question: string; answer: string; category?: string }>>('/faqs');
    return response.data!;
  }
}