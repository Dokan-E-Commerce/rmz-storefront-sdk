import { HttpClient, HttpClientConfig } from './utils/http-client';
import { StoreService } from './services/store.service';
import { ProductsService } from './services/products.service';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { WishlistService } from './services/wishlist.service';
import { CategoriesService } from './services/categories.service';
import { OrdersService } from './services/orders.service';
import { CheckoutService } from './services/checkout.service';
import { PagesService } from './services/pages.service';

export interface StorefrontSDKConfig {
  baseURL: string;
  publicKey: string;
  secretKey: string;
  timeout?: number;
  headers?: Record<string, string>;
  environment?: 'production' | 'development';
}

export class StorefrontSDK {
  private http: HttpClient;
  
  // Services
  public store: StoreService;
  public products: ProductsService;
  public auth: AuthService;
  public cart: CartService;
  public wishlist: WishlistService;
  public categories: CategoriesService;
  public orders: OrdersService;
  public checkout: CheckoutService;
  public pages: PagesService;

  constructor(config: StorefrontSDKConfig) {
    // Initialize HTTP client
    this.http = new HttpClient({
      baseURL: config.baseURL,
      publicKey: config.publicKey,
      secretKey: config.secretKey,
      timeout: config.timeout,
      headers: config.headers,
      environment: config.environment,
    });

    // Initialize services
    this.store = new StoreService(this.http);
    this.products = new ProductsService(this.http);
    this.auth = new AuthService(this.http);
    this.cart = new CartService(this.http);
    this.wishlist = new WishlistService(this.http);
    this.categories = new CategoriesService(this.http);
    this.orders = new OrdersService(this.http);
    this.checkout = new CheckoutService(this.http);
    this.pages = new PagesService(this.http);
  }

  /**
   * Set authentication token
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

  /**
   * Set cart token
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

  /**
   * Get the underlying HTTP client for advanced use cases
   */
  getHttpClient(): HttpClient {
    return this.http;
  }
}