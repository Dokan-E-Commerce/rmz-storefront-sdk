![Rmz Storefront JS SdK](https://i.ibb.co/XffTrLGB/rmz-storefront-sdk-js.png)



# 🛡️ RMZ.GG Storefront JS SDK

[![npm version](https://badge.fury.io/js/%40rmz%2Fstorefront-sdk.svg)](https://badge.fury.io/js/%40rmz%2Fstorefront-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Security](https://img.shields.io/badge/Security-HMAC--SHA256-green)](https://tools.ietf.org/html/rfc2104)
[![Framework Agnostic](https://img.shields.io/badge/Framework-Agnostic-purple)](https://github.com/rmz/storefront-sdk)


Simply! Create your own store and let us handle the backend operations, payments, emails, everything! and start selling easily.

A **secure**, **framework-agnostic** SDK for the RMZ Storefront API. Works seamlessly with React, Vue, Angular, Svelte, Vanilla JS, and Node.js environments.

## ✨ Features

- 🔒 **Enterprise-grade Security**: HMAC-SHA256 authentication with automatic signature generation
- 🌍 **Universal Compatibility**: Works in browsers, Node.js, Web Workers, and any JavaScript environment
- 🎯 **Framework Agnostic**: Use with React, Vue, Angular, Svelte, or Vanilla JS
- 🔥 **Firebase/Supabase-style API**: Intuitive method chaining for complex queries
- 📱 **Client & Server-side**: Secure operation in both environments with server-to-server HMAC authentication
- 🚀 **TypeScript First**: Full type safety and IntelliSense support
- ⚡ **Performance Optimized**: Automatic retry, caching, and request deduplication
- 🛡️ **Security Focused**: No sensitive data exposure, automatic sanitization
- 🌐 **Default API URL**: Automatically uses `https://front.rmz.gg/api` unless overridden
- 🔐 **Server-to-Server Auth**: Full HMAC authentication for backend/SSR operations

## 🚀 Quick Start

### Installation

```bash
npm install rmz-storefront-sdk
# or
yarn add rmz-storefront-sdk
# or
pnpm add rmz-storefront-sdk
```

### Basic Usage

```typescript
import { createStorefrontSDK } from '@rmz/storefront-sdk';

// Initialize the SDK (client-side)
const sdk = createStorefrontSDK({
  publicKey: 'pk_your_public_key_here',
  // apiUrl is optional - defaults to https://front.rmz.gg/api
  environment: 'production'
});

// Initialize the SDK (server-side with HMAC auth)
const serverSDK = createStorefrontSDK({
  publicKey: 'pk_your_public_key_here',
  secretKey: 'sk_your_secret_key_here', // Enables HMAC authentication
  apiUrl: 'https://front.rmz.gg/api', // Default, can be overridden
  environment: 'production'
});

// Get store information
const store = await sdk.store.get();

// Firebase/Supabase-style queries
const featuredProducts = await sdk.products
  .where('featured', '=', true)
  .orderBy('created_at', 'desc')
  .limit(8)
  .get();

// Add to cart
const cart = await sdk.cart.addItem(productId, 2);
```

## 🎯 Framework Examples

### React

```jsx
import { useStorefrontSDK } from '@rmz/storefront-sdk';
import { useEffect, useState } from 'react';

function ProductList() {
  const sdk = useStorefrontSDK({
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY,
  });

  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function loadProducts() {
      const { data } = await sdk.products.getAll({ per_page: 12 });
      setProducts(data);
    }
    loadProducts();
  }, [sdk]);

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### Vue 3

```vue
<script setup>
import { useStorefront } from '@rmz/storefront-sdk';
import { ref, onMounted } from 'vue';

const sdk = useStorefront({
  apiUrl: import.meta.env.VITE_API_URL,
  publicKey: import.meta.env.VITE_PUBLIC_KEY,
});

const products = ref([]);

onMounted(async () => {
  const { data } = await sdk.value.products.getAll();
  products.value = data;
});
</script>

<template>
  <div>
    <div v-for="product in products" :key="product.id">
      {{ product.name }}
    </div>
  </div>
</template>
```

### Angular

```typescript
import { Injectable } from '@angular/core';
import { createStorefrontSDK, type SecureStorefrontSDK } from '@rmz/storefront-sdk';

@Injectable({
  providedIn: 'root'
})
export class StorefrontService {
  private sdk: SecureStorefrontSDK;

  constructor() {
    this.sdk = createStorefrontSDK({
      apiUrl: environment.apiUrl,
      publicKey: environment.publicKey,
    });
  }

  async getProducts() {
    return this.sdk.products.getAll();
  }

  async addToCart(productId: number, quantity: number) {
    return this.sdk.cart.addItem(productId, quantity);
  }
}
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@rmz/storefront-sdk@latest/dist/index.umd.js"></script>
</head>
<body>
  <script>
    const { createStorefrontSDK } = RMZStorefront;

    const sdk = createStorefrontSDK({
      apiUrl: 'https://your-store.rmz.gg/api/storefront',
      publicKey: 'pk_your_public_key_here'
    });

    async function loadProducts() {
      const products = await sdk.products.getFeatured(8);
      console.log('Featured products:', products);
    }

    loadProducts();
  </script>
</body>
</html>
```

### Node.js (Server-side with HMAC Authentication)

```javascript
const { createStorefrontSDK } = require('@rmz/storefront-sdk');

// Server-to-server authentication with HMAC
const sdk = createStorefrontSDK({
  publicKey: process.env.RMZ_PUBLIC_KEY,
  secretKey: process.env.RMZ_SECRET_KEY, // Required for server-side HMAC auth
  // apiUrl defaults to https://front.rmz.gg/api
  environment: 'production'
});

// Server-side operations with full HMAC security
async function getStoreData() {
  const store = await sdk.store.get();
  const products = await sdk.products.getAll({ per_page: 100 });
  return { store, products };
}

// For Next.js API routes or SSR
export async function getServerSideProps() {
  const storeData = await getStoreData();
  return {
    props: storeData
  };
}
```

## 🔥 Firebase/Supabase-style Queries

The SDK provides an intuitive query builder similar to Firebase and Supabase:

```typescript
// Complex queries with method chaining
const expensiveProducts = await sdk.products
  .where('price', '>', 100)
  .where('category', '=', 'electronics')
  .orderBy('price', 'desc')
  .limit(10)
  .get();

// Search with filters
const searchResults = await sdk.products.search('laptop', {
  category: 'electronics',
  price_min: 500,
  price_max: 2000,
  per_page: 20
});

// Category products
const categoryProducts = await sdk.categories
  .getProducts('electronics', {
    sort: 'price_asc',
    per_page: 12
  });
```

## 🛡️ Security Features

### Automatic HMAC Authentication

The SDK automatically handles HMAC-SHA256 signature generation and verification for server-to-server communication:

```typescript
// Client-side (browser) - automatic public key authentication
const sdk = createStorefrontSDK({
  publicKey: 'pk_public_key_here', // Only public key needed
  // apiUrl defaults to https://front.rmz.gg/api
});

// Server-side (Node.js) - full HMAC security for server-to-server requests
const sdk = createStorefrontSDK({
  publicKey: 'pk_public_key_here',
  secretKey: 'sk_secret_key_here', // Enables HMAC signatures
  apiUrl: 'https://front.rmz.gg/api', // Default API endpoint
});
```

### Server-to-Server Authentication

When using the secret key, the SDK automatically:
- Generates HMAC-SHA256 signatures for each request
- Adds proper authentication headers
- Validates timestamps to prevent replay attacks
- Supports both Laravel and custom API authentication schemes

### Environment Detection

The SDK automatically detects the environment and applies appropriate security measures:

```typescript
import { Environment } from '@rmz/storefront-sdk';

console.log(Environment.info);
// {
//   isServer: false,
//   isBrowser: true,
//   isWebWorker: false,
//   isNode: false,
//   platform: 'browser'
// }
```

### Data Sanitization

All API responses are automatically sanitized to prevent sensitive data exposure:

```typescript
// Sensitive fields are automatically removed from client-side responses
const customer = await sdk.auth.getProfile();
// Fields like 'password', 'secret_key', 'api_token' are never exposed
```

## 📚 Complete API Reference

### Store API

```typescript
// Get store information (with optional includes)
const store = await sdk.store.get({
  include: ['categories', 'pages', 'announcements']
});

// Get available currencies
const currencies = await sdk.store.getCurrencies();

// Change currency
await sdk.store.changeCurrency('USD');

// Get store settings
const settings = await sdk.store.getSettings();

// Get store features
const features = await sdk.store.getFeatures();

// Get store banners
const banners = await sdk.store.getBanners();
```

### Products API

```typescript
// Get all products with pagination
const { data, pagination } = await sdk.products.getAll({
  page: 1,
  per_page: 12,
  category: 'electronics',
  sort: 'price_asc'
});

// Get single product
const product = await sdk.products.getBySlug('product-slug');

// Search products
const { data } = await sdk.products.search('laptop', {
  price_min: 500,
  price_max: 2000
});

// Get featured products
const featured = await sdk.products.getFeatured(8);

// Get related products
const related = await sdk.products.getRelated(productId, 4);

// Get product reviews
const { data: reviews } = await sdk.products.getReviews(productId);
```

### Cart API

```typescript
// Get current cart
const cart = await sdk.cart.get();

// Add item to cart
const updatedCart = await sdk.cart.addItem(productId, 2, {
  fields: { color: 'red', size: 'L' },
  notice: 'Special instructions'
});

// Update item quantity
await sdk.cart.updateItem(itemId, 3);

// Remove item
await sdk.cart.removeItem(itemId);

// Apply coupon
await sdk.cart.applyCoupon('DISCOUNT10');

// Get cart count
const count = await sdk.cart.getCount();

// Clear cart
await sdk.cart.clear();
```

### Authentication API

```typescript
// Start phone authentication
const { session_token } = await sdk.auth.startPhoneAuth('50505050', '966');

// Verify OTP
const { token, customer } = await sdk.auth.verifyOTP('1337', session_token);

// Resend OTP
await sdk.auth.resendOTP(session_token);

// Complete registration (for new customers)
const { token, customer } = await sdk.auth.completeRegistration({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  sessionToken: session_token
});

// Get customer profile (requires authentication token)
const profile = await sdk.auth.getProfile();

// Update customer profile
await sdk.auth.updateProfile({ 
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com'
});

// Logout customer
await sdk.auth.logout();
```

### Orders API

```typescript
// Get customer orders (requires authentication)
const { data: orders, pagination } = await sdk.orders.getAll({ 
  page: 1, 
  per_page: 10 
});

// Get specific order by ID
const order = await sdk.orders.getById(orderId);

// Get customer courses (for digital products)
const courses = await sdk.orders.getCourses();
```

### Checkout API

```typescript
// Create checkout session
const checkoutResult = await sdk.checkout.create();

// Handle different checkout types
if (checkoutResult.type === 'free_order') {
  // Free order - no payment required
  console.log('Order created:', checkoutResult.order_id);
} else if (checkoutResult.type === 'payment_required') {
  // Redirect to payment
  window.location.href = checkoutResult.checkout_url;
}

// Get checkout result after payment
const { status, order } = await sdk.checkout.getResult(sessionId);
```

### Wishlist API

```typescript
// Get customer wishlist (requires authentication)
const { items, count } = await sdk.wishlist.get();

// Add product to wishlist
await sdk.wishlist.addItem(productId);

// Remove product from wishlist
await sdk.wishlist.removeItem(productId);

// Check if product is in wishlist
const { in_wishlist } = await sdk.wishlist.check(productId);

// Clear entire wishlist
await sdk.wishlist.clear();
```

### Reviews API

```typescript
// Get all reviews with filters
const { data: reviews, pagination } = await sdk.reviews.getAll({
  page: 1,
  per_page: 10,
  rating: 5 // Filter by rating
});

// Get recent reviews
const recentReviews = await sdk.reviews.getRecent(6);

// Submit a product review (requires authentication)
const review = await sdk.reviews.submit(productId, {
  rating: 5,
  comment: 'Great product!'
});

// Get review statistics
const stats = await sdk.reviews.getStats();
```

### Categories API

```typescript
// Get all categories
const categories = await sdk.categories.getAll();

// Get category by ID
const category = await sdk.categories.getById(categoryId);

// Get category by slug
const category = await sdk.categories.getBySlug('electronics');

// Get products in a category
const { data: products, pagination } = await sdk.categories.getProducts('electronics', {
  page: 1,
  per_page: 12,
  sort: 'price_asc'
});
```

### Components API

```typescript
// Get homepage components
const components = await sdk.components.getAll();

// Get specific component by ID
const component = await sdk.components.getById(componentId);

// Get products for a specific component
const { data: products, pagination } = await sdk.components.getProducts(componentId, {
  page: 1,
  per_page: 12
});
```

### Pages API

```typescript
// Get all pages
const pages = await sdk.pages.getAll();

// Get specific page by URL
const page = await sdk.pages.getByUrl('about-us');
```

### Courses API

```typescript
// Get all courses (requires authentication)
const { data: courses, pagination } = await sdk.courses.getAll({
  page: 1,
  per_page: 10
});

// Get specific course
const course = await sdk.courses.getById(courseId);

// Get course progress
const progress = await sdk.courses.getProgress(courseId);

// Get specific module
const module = await sdk.courses.getModule(courseId, moduleId);

// Mark module as complete
await sdk.courses.completeModule(courseId, moduleId);

// Legacy customer course endpoints
const customerCourses = await sdk.courses.getCustomerCourses();
const customerCourse = await sdk.courses.getCustomerCourse(courseId);
const customerModule = await sdk.courses.getCustomerCourseModule(courseId, moduleId);
```

### Management API (Server-side Only)

```typescript
// Get analytics data (requires secret key)
const analytics = await sdk.management.getAnalytics({
  start_date: '2023-01-01',
  end_date: '2023-12-31',
  metrics: ['sales', 'customers', 'revenue']
});

// Update inventory
await sdk.management.updateInventory({
  product_id: 123,
  quantity: 50,
  operation: 'set' // 'set', 'add', or 'subtract'
});

// Get orders for management
const { data: orders } = await sdk.management.getOrders({
  page: 1,
  per_page: 50,
  status: 'completed'
});

// Export customer data
const customerData = await sdk.management.exportCustomers({
  format: 'csv',
  date_from: '2023-01-01'
});

// Get webhook data
const webhookData = await sdk.management.getWebhookData({
  type: 'order_created',
  limit: 100
});
```

### Custom Token Management API

```typescript
// Generate new API token (requires authentication)
const { token, token_id } = await sdk.customTokens.generateToken({
  name: 'Mobile App Token',
  permissions: ['products:read', 'cart:write'],
  expires_at: '2024-12-31'
});

// List all tokens
const tokens = await sdk.customTokens.listTokens();

// Revoke token
await sdk.customTokens.revokeToken(tokenId);

// Get token usage statistics
const stats = await sdk.customTokens.getTokenStats(tokenId);

// Validate token
const validation = await sdk.customTokens.validateToken(token);

// Get available permissions
const permissions = await sdk.customTokens.getTokenPermissions();
```

### Enhanced Cart API

```typescript
// Validate cart contents
const validation = await sdk.cart.validate();

// Get cart summary with totals
const summary = await sdk.cart.getSummary();
// Returns: { subtotal, tax, shipping, discount, total }
```

## ⚙️ Configuration

### Full Configuration Options

```typescript
interface StorefrontConfig {
  apiUrl: string;              // API base URL
  publicKey: string;           // Public key for authentication
  secretKey?: string;          // Secret key (server-side only)
  environment?: 'production' | 'development';
  version?: string;            // API version
  timeout?: number;            // Request timeout (ms)
  maxRetries?: number;         // Maximum retry attempts
  retryDelay?: number;         // Delay between retries (ms)
  enableLogging?: boolean;     // Enable debug logging
}
```

### Environment Variables

For security, use environment variables:

```bash
# Client-side (Next.js, Vite, etc.)
NEXT_PUBLIC_RMZ_API_URL=https://your-store.rmz.gg/api/storefront
NEXT_PUBLIC_RMZ_PUBLIC_KEY=pk_your_public_key

# Server-side (Node.js)
RMZ_API_URL=https://your-store.rmz.gg/api/storefront
RMZ_PUBLIC_KEY=pk_your_public_key
RMZ_SECRET_KEY=sk_your_secret_key
```

## 🔧 Advanced Usage

### Custom HTTP Headers

```typescript
// The SDK automatically handles security headers
// But you can access the underlying HTTP client for custom requests
import { SecurityManager, UniversalHttpClient } from '@rmz/storefront-sdk';

const security = new SecurityManager({
  publicKey: 'your_public_key',
  secretKey: 'your_secret_key' // server-side only
});

const httpClient = new UniversalHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 30000
}, security);
```

### Error Handling

```typescript
try {
  const products = await sdk.products.getAll();
} catch (error) {
  if (error.message.includes('401')) {
    // Handle authentication error
    console.error('Authentication failed');
  } else if (error.message.includes('429')) {
    // Handle rate limit
    console.error('Rate limit exceeded');
  } else {
    // Handle other errors
    console.error('API error:', error.message);
  }
}
```

### Health Check

```typescript
// Check API connectivity and authentication
const health = await sdk.healthCheck();
if (health.status === 'ok') {
  console.log('API is healthy');
} else {
  console.error('API error:', health.message);
}
```

### SDK Information

```typescript
// Get SDK version and environment info
const info = sdk.getInfo();
console.log('SDK Version:', info.version);
console.log('Environment:', info.environment.platform);
console.log('Config:', info.config);
```

## 🔒 Security Best Practices

### 1. Environment Separation

```typescript
// ✅ Good: Separate configs for client/server
const clientConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY, // Client-side safe
};

const serverConfig = {
  apiUrl: process.env.API_URL,
  publicKey: process.env.PUBLIC_KEY,
  secretKey: process.env.SECRET_KEY, // Server-side only
};
```

### 2. Key Management

```typescript
// ❌ Bad: Exposing secret key on client-side
const sdk = createStorefrontSDK({
  apiUrl: 'https://api.example.com',
  publicKey: 'pk_public',
  secretKey: 'sk_secret' // 🚨 NEVER do this in browser!
});

// ✅ Good: Only public key on client-side
const sdk = createStorefrontSDK({
  apiUrl: 'https://api.example.com',
  publicKey: 'pk_public' // Safe for browser
});
```

### 3. HTTPS Only

```typescript
// ✅ Always use HTTPS in production
const sdk = createStorefrontSDK({
  apiUrl: 'https://your-secure-api.com', // HTTPS required
  publicKey: 'pk_your_key',
  environment: 'production'
});
```

## 🚀 Performance Tips

### 1. Singleton Pattern

```typescript
// ✅ Create once, use everywhere
const sdk = createStorefrontSDK(config); // Uses singleton internally

// ✅ Or use React hook for automatic memoization
const sdk = useStorefrontSDK(config);
```

### 2. Pagination

```typescript
// ✅ Use pagination for large datasets
const { data, pagination } = await sdk.products.getAll({
  per_page: 20, // Reasonable page size
  page: 1
});
```

### 3. Caching

```typescript
// The SDK automatically handles caching and deduplication
// Multiple identical requests are automatically deduplicated
const promise1 = sdk.products.getFeatured();
const promise2 = sdk.products.getFeatured(); // Same request, reused
const [result1, result2] = await Promise.all([promise1, promise2]);
```

## 📱 Mobile & React Native

The SDK works seamlessly with React Native:

```typescript
import { createStorefrontSDK } from '@rmz/storefront-sdk';

const sdk = createStorefrontSDK({
  apiUrl: 'https://your-api.com',
  publicKey: 'pk_your_key',
});

// Use normally in React Native components
function ProductScreen() {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    sdk.products.getBySlug('product-slug').then(setProduct);
  }, []);

  return product ? <Text>{product.name}</Text> : <Text>Loading...</Text>;
}
```

## 🧪 Testing

```typescript
// Mock the SDK for testing
jest.mock('@rmz/storefront-sdk', () => ({
  createStorefrontSDK: () => ({
    products: {
      getAll: jest.fn().mockResolvedValue({ data: [] }),
      getFeatured: jest.fn().mockResolvedValue([]),
    },
    cart: {
      addItem: jest.fn().mockResolvedValue({ items: [] }),
    }
  })
}));
```

## 📊 Bundle Size

The SDK is optimized for minimal bundle size:

- **Core SDK**: ~15KB gzipped
- **Tree-shakeable**: Import only what you need
- **Zero dependencies**: No external runtime dependencies
- **Universal build**: Works everywhere without polyfills


## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Documentation](https://docs.rmz.gg/storefront-sdk)
- [API Reference](https://api-docs.rmz.gg)
- [GitHub](https://github.com/rmz/storefront-sdk)
- [Issues](https://github.com/rmz/storefront-sdk/issues)
- [Security Policy](SECURITY.md)

## 📞 Support

- 📧 Email: dev@dokan.sa
---

Made with ❤️ by the Dokan Dev Team