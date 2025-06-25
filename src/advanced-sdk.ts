/**
 * Advanced Storefront SDK - Firebase/Supabase Style
 * 
 * Features:
 * - Method chaining (products.where().orderBy().limit())
 * - Real-time subscriptions
 * - Caching and offline support
 * - Advanced querying
 * - Event-driven architecture
 * - Type-safe operations
 */

import { HttpClient, HttpClientConfig } from './utils/http-client';
import { EventEmitter } from 'events';

// Base interfaces
interface BaseRecord {
  id: number;
  created_at: string;
  updated_at: string;
}

interface QueryOptions {
  where?: Record<string, any>;
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
  select?: string[];
  include?: string[];
}

interface RealtimeOptions {
  event?: 'insert' | 'update' | 'delete' | '*';
  schema?: string;
  table?: string;
  filter?: string;
}

// Advanced query builder
class QueryBuilder<T extends BaseRecord> {
  private queryOptions: QueryOptions = {};
  private tableName: string;
  private client: HttpClient;
  private eventEmitter: EventEmitter;

  constructor(tableName: string, client: HttpClient, eventEmitter: EventEmitter) {
    this.tableName = tableName;
    this.client = client;
    this.eventEmitter = eventEmitter;
  }

  // Filtering methods
  where(field: string, operator: string, value: any): this {
    if (!this.queryOptions.where) {
      this.queryOptions.where = {};
    }
    this.queryOptions.where[`${field}__${operator}`] = value;
    return this;
  }

  eq(field: string, value: any): this {
    return this.where(field, 'eq', value);
  }

  neq(field: string, value: any): this {
    return this.where(field, 'neq', value);
  }

  gt(field: string, value: any): this {
    return this.where(field, 'gt', value);
  }

  gte(field: string, value: any): this {
    return this.where(field, 'gte', value);
  }

  lt(field: string, value: any): this {
    return this.where(field, 'lt', value);
  }

  lte(field: string, value: any): this {
    return this.where(field, 'lte', value);
  }

  like(field: string, pattern: string): this {
    return this.where(field, 'like', pattern);
  }

  ilike(field: string, pattern: string): this {
    return this.where(field, 'ilike', pattern);
  }

  in(field: string, values: any[]): this {
    return this.where(field, 'in', values);
  }

  contains(field: string, value: any): this {
    return this.where(field, 'contains', value);
  }

  // Ordering methods
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    if (!this.queryOptions.orderBy) {
      this.queryOptions.orderBy = [];
    }
    this.queryOptions.orderBy.push({ field, direction });
    return this;
  }

  order(field: string, options?: { ascending?: boolean; nullsFirst?: boolean }): this {
    const direction = options?.ascending !== false ? 'asc' : 'desc';
    return this.orderBy(field, direction);
  }

  // Limiting and pagination
  limit(count: number): this {
    this.queryOptions.limit = count;
    return this;
  }

  offset(count: number): this {
    this.queryOptions.offset = count;
    return this;
  }

  range(from: number, to: number): this {
    this.queryOptions.offset = from;
    this.queryOptions.limit = to - from + 1;
    return this;
  }

  // Selection methods
  select(fields: string): this {
    this.queryOptions.select = fields.split(',').map(f => f.trim());
    return this;
  }

  include(relations: string): this {
    this.queryOptions.include = relations.split(',').map(r => r.trim());
    return this;
  }

  // Execution methods
  async get(): Promise<{ data: T[]; count?: number; error?: string }> {
    try {
      const params = this.buildQueryParams();
      const response = await this.client.get<T[]>(`/storefront/${this.tableName}?${params}`);
      
      this.eventEmitter.emit('query:executed', {
        table: this.tableName,
        options: this.queryOptions,
        result: response
      });

      return {
        data: response.data || [],
        count: (response as any).pagination?.total,
      };
    } catch (error: any) {
      return {
        data: [],
        error: error.message
      };
    }
  }

  async single(): Promise<{ data: T | null; error?: string }> {
    const result = await this.limit(1).get();
    return {
      data: result.data[0] || null,
      error: result.error
    };
  }

  async count(): Promise<{ count: number; error?: string }> {
    try {
      const params = this.buildQueryParams();
      const response = await this.client.get(`/storefront/${this.tableName}/count?${params}`);
      return {
        count: response.data?.count || 0
      };
    } catch (error: any) {
      return {
        count: 0,
        error: error.message
      };
    }
  }

  // Real-time subscriptions
  subscribe(callback: (payload: any) => void, options?: RealtimeOptions) {
    const channel = `${this.tableName}:${JSON.stringify(this.queryOptions)}`;
    
    this.eventEmitter.on(channel, callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off(channel, callback);
    };
  }

  // Streaming for large datasets
  async *stream(): AsyncIterable<T> {
    let offset = 0;
    const batchSize = this.queryOptions.limit || 100;
    
    while (true) {
      const batch = await this.offset(offset).limit(batchSize).get();
      
      if (batch.data.length === 0) break;
      
      for (const item of batch.data) {
        yield item;
      }
      
      if (batch.data.length < batchSize) break;
      offset += batchSize;
    }
  }

  private buildQueryParams(): string {
    const params = new URLSearchParams();
    
    // Add where conditions
    if (this.queryOptions.where) {
      Object.entries(this.queryOptions.where).forEach(([key, value]) => {
        params.append(key, String(value));
      });
    }
    
    // Add ordering
    if (this.queryOptions.orderBy) {
      const orderStr = this.queryOptions.orderBy
        .map(o => `${o.field}:${o.direction}`)
        .join(',');
      params.append('order', orderStr);
    }
    
    // Add pagination
    if (this.queryOptions.limit) {
      params.append('limit', String(this.queryOptions.limit));
    }
    if (this.queryOptions.offset) {
      params.append('offset', String(this.queryOptions.offset));
    }
    
    // Add selection
    if (this.queryOptions.select) {
      params.append('select', this.queryOptions.select.join(','));
    }
    if (this.queryOptions.include) {
      params.append('include', this.queryOptions.include.join(','));
    }
    
    return params.toString();
  }
}

// Advanced table interface
class AdvancedTable<T extends BaseRecord> {
  protected tableName: string;
  protected client: HttpClient;
  protected eventEmitter: EventEmitter;
  protected cache: Map<string, { data: any; timestamp: number }> = new Map();
  protected cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(tableName: string, client: HttpClient, eventEmitter: EventEmitter) {
    this.tableName = tableName;
    this.client = client;
    this.eventEmitter = eventEmitter;
  }

  // Query builder entry point
  query(): QueryBuilder<T> {
    return new QueryBuilder<T>(this.tableName, this.client, this.eventEmitter);
  }

  // Convenience methods that return query builders
  where(field: string, operator: string, value: any): QueryBuilder<T> {
    return this.query().where(field, operator, value);
  }

  eq(field: string, value: any): QueryBuilder<T> {
    return this.query().eq(field, value);
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryBuilder<T> {
    return this.query().orderBy(field, direction);
  }

  limit(count: number): QueryBuilder<T> {
    return this.query().limit(count);
  }

  select(fields: string): QueryBuilder<T> {
    return this.query().select(fields);
  }

  include(relations: string): QueryBuilder<T> {
    return this.query().include(relations);
  }

  // Direct CRUD operations
  async findById(id: number): Promise<{ data: T | null; error?: string }> {
    const cacheKey = `${this.tableName}:${id}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { data: cached.data };
    }

    try {
      const response = await this.client.get<T>(`/storefront/${this.tableName}/${id}`);
      const data = response.data;
      
      // Cache the result
      if (data) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }
      
      return { data: data || null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async insert(data: Partial<T>): Promise<{ data: T | null; error?: string }> {
    try {
      const response = await this.client.post<T>(`/storefront/${this.tableName}`, data);
      const result = response.data;
      
      this.eventEmitter.emit('insert', { table: this.tableName, data: result });
      
      return { data: result || null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async update(id: number, data: Partial<T>): Promise<{ data: T | null; error?: string }> {
    try {
      const response = await this.client.patch<T>(`/storefront/${this.tableName}/${id}`, data);
      const result = response.data;
      
      // Invalidate cache
      this.cache.delete(`${this.tableName}:${id}`);
      
      this.eventEmitter.emit('update', { table: this.tableName, id, data: result });
      
      return { data: result || null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async delete(id: number): Promise<{ error?: string }> {
    try {
      await this.client.delete(`/storefront/${this.tableName}/${id}`);
      
      // Invalidate cache
      this.cache.delete(`${this.tableName}:${id}`);
      
      this.eventEmitter.emit('delete', { table: this.tableName, id });
      
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Batch operations
  async insertMany(items: Partial<T>[]): Promise<{ data: T[]; error?: string }> {
    try {
      const response = await this.client.post<T[]>(`/storefront/${this.tableName}/batch`, { items });
      const data = response.data || [];
      
      this.eventEmitter.emit('insert:batch', { table: this.tableName, data });
      
      return { data };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  }

  async updateMany(updates: { id: number; data: Partial<T> }[]): Promise<{ data: T[]; error?: string }> {
    try {
      const response = await this.client.patch<T[]>(`/storefront/${this.tableName}/batch`, { updates });
      const data = response.data || [];
      
      // Invalidate cache for updated items
      updates.forEach(update => {
        this.cache.delete(`${this.tableName}:${update.id}`);
      });
      
      this.eventEmitter.emit('update:batch', { table: this.tableName, data });
      
      return { data };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  }

  // Upsert operation
  async upsert(data: Partial<T> & { id?: number }): Promise<{ data: T | null; error?: string }> {
    if (data.id) {
      return this.update(data.id, data);
    } else {
      return this.insert(data);
    }
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export { QueryBuilder, AdvancedTable, type QueryOptions, type RealtimeOptions };