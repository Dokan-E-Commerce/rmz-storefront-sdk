# Security Policy

## Reporting Security Vulnerabilities

We take the security of the RMZ Storefront SDK seriously. If you discover a security vulnerability, please follow these steps:

### 🚨 Reporting Process

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. **DO** email us directly at: **security@rmz.gg**
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Your contact information (optional)

### ⏱️ Response Timeline

- **Initial Response**: Within 24 hours
- **Detailed Analysis**: Within 72 hours
- **Fix & Release**: Within 7 days for critical issues

## 🛡️ Security Features

### Supported Security Measures

| Feature | Client-Side | Server-Side | Status |
|---------|-------------|-------------|--------|
| HMAC-SHA256 Authentication | ❌ | ✅ | ✅ Implemented |
| Public Key Authentication | ✅ | ✅ | ✅ Implemented |
| Environment Detection | ✅ | ✅ | ✅ Implemented |
| Data Sanitization | ✅ | ✅ | ✅ Implemented |
| Request Signing | ❌ | ✅ | ✅ Implemented |
| Timestamp Validation | ✅ | ✅ | ✅ Implemented |
| Rate Limiting Support | ✅ | ✅ | ✅ Implemented |
| HTTPS Enforcement | ✅ | ✅ | ✅ Implemented |

### 🔐 Authentication Security

#### Client-Side (Browser)
- **Public Key Only**: Secret keys are never exposed to clients
- **Environment Detection**: Automatic detection of browser environment
- **Secure Headers**: Appropriate headers for browser requests
- **Origin Validation**: CORS compliance and origin checking

#### Server-Side (Node.js)
- **HMAC Authentication**: Full HMAC-SHA256 signature verification
- **Secret Key Protection**: Server-only secret key handling
- **Request Signing**: All requests signed with HMAC
- **Replay Attack Prevention**: Timestamp-based nonce validation

### 🔒 Data Protection

#### Sensitive Data Filtering
The SDK automatically removes sensitive fields from all responses:

```typescript
// These fields are NEVER exposed on client-side:
const sensitiveFields = [
  'password', 'secret', 'key', 'token', 'api_key',
  'private_key', 'secret_key', 'webhook_secret',
  'email_verified_at', 'remember_token', 'deleted_at',
  'created_by', 'updated_by', 'deleted_by'
];
```

#### Environment Isolation
```typescript
// ✅ Secure: Different configs for different environments
const clientConfig = {
  publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY // Safe for browsers
};

const serverConfig = {
  publicKey: process.env.PUBLIC_KEY,
  secretKey: process.env.SECRET_KEY // Server-only
};
```

## 🚫 Security Don'ts

### ❌ Never Do These Things

1. **Expose Secret Keys in Client-Side Code**
   ```typescript
   // 🚨 DANGEROUS - Never do this!
   const sdk = createStorefrontSDK({
     secretKey: 'sk_secret_key_here' // Exposed to browser!
   });
   ```

2. **Use HTTP in Production**
   ```typescript
   // 🚨 DANGEROUS - Never use HTTP in production!
   const sdk = createStorefrontSDK({
     apiUrl: 'http://api.example.com' // Unencrypted!
   });
   ```

3. **Hardcode Credentials**
   ```typescript
   // 🚨 DANGEROUS - Never hardcode keys!
   const sdk = createStorefrontSDK({
     publicKey: 'pk_12345...' // Hardcoded in source!
   });
   ```

4. **Disable HTTPS Verification**
   ```typescript
   // 🚨 DANGEROUS - Never disable SSL verification!
   process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // NEVER!
   ```

### ✅ Security Best Practices

1. **Use Environment Variables**
   ```typescript
   // ✅ SECURE
   const sdk = createStorefrontSDK({
     apiUrl: process.env.NEXT_PUBLIC_API_URL,
     publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY
   });
   ```

2. **Separate Client/Server Configs**
   ```typescript
   // ✅ SECURE - Client config (browser-safe)
   const clientSDK = createStorefrontSDK({
     publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY
   });

   // ✅ SECURE - Server config (full security)
   const serverSDK = createStorefrontSDK({
     publicKey: process.env.PUBLIC_KEY,
     secretKey: process.env.SECRET_KEY
   });
   ```

3. **Always Use HTTPS**
   ```typescript
   // ✅ SECURE
   const sdk = createStorefrontSDK({
     apiUrl: 'https://secure-api.example.com',
     environment: 'production'
   });
   ```

4. **Implement Error Handling**
   ```typescript
   // ✅ SECURE - Proper error handling
   try {
     const data = await sdk.products.getAll();
   } catch (error) {
     // Handle errors securely without exposing sensitive info
     console.error('API Error:', error.message);
   }
   ```

## 🔍 Security Validation

### Environment Validation
The SDK automatically validates the environment and configuration:

```typescript
// Automatic security validation
const sdk = createStorefrontSDK(config);
console.log(sdk.getInfo().environment);
// {
//   isServer: false,
//   isBrowser: true,
//   canUseSecureFeatures: true,
//   platform: 'browser'
// }
```

### Configuration Validation
```typescript
// The SDK validates configuration on initialization
try {
  const sdk = createStorefrontSDK({
    apiUrl: 'https://api.example.com',
    publicKey: 'invalid_key', // Will throw error if invalid
  });
} catch (error) {
  console.error('Invalid configuration:', error.message);
}
```

## 🛠️ Security Testing

### Automated Security Tests
The SDK includes automated security tests:

```bash
# Run security tests
npm run test:security

# Security audit
npm audit

# Check for known vulnerabilities
npm run security:scan
```

### Manual Security Testing
For manual security testing:

1. **Key Exposure Testing**
   - Verify secret keys are never in client bundles
   - Check browser developer tools for exposed credentials

2. **HTTPS Enforcement**
   - Test HTTP requests are rejected
   - Verify SSL certificate validation

3. **Data Sanitization**
   - Confirm sensitive fields are filtered
   - Test response data contains no secrets

## 📋 Security Checklist

Before deploying with the SDK:

- [ ] Environment variables configured correctly
- [ ] No hardcoded credentials in source code
- [ ] HTTPS URLs used for all environments
- [ ] Client/server configurations separated
- [ ] Error handling implemented
- [ ] Security tests passing
- [ ] Latest SDK version installed
- [ ] Dependencies audited for vulnerabilities

## 🔄 Security Updates

### Supported Versions
We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | ✅ Active support  |
| 1.x.x   | ⚠️ Security only   |
| < 1.0   | ❌ Not supported   |

### Update Process
1. **Critical Security Updates**: Released immediately
2. **Security Patches**: Included in next patch release
3. **Security Enhancements**: Included in next minor release

### Notification Channels
- **GitHub Security Advisories**: Automatic notifications
- **npm Audit**: Vulnerability scanning
- **Release Notes**: Security changes documented
- **Security Email**: security@rmz.gg (for critical issues)

## 🎯 Threat Model

### Protected Against
- ✅ Secret key exposure
- ✅ Man-in-the-middle attacks (HTTPS)
- ✅ Replay attacks (timestamp validation)
- ✅ Data injection attacks (input validation)
- ✅ Cross-site scripting (data sanitization)
- ✅ Rate limiting abuse
- ✅ Unauthorized API access

### Not Protected Against
- ❌ Compromised client devices
- ❌ Social engineering attacks
- ❌ Physical access to servers
- ❌ DNS hijacking (use reputable DNS)
- ❌ Compromised development environments

## 📞 Security Contacts

- **Security Email**: security@rmz.gg
- **General Support**: support@rmz.gg
- **Bug Reports**: [GitHub Issues](https://github.com/rmz/storefront-sdk/issues)
- **Documentation**: [Security Docs](https://docs.rmz.gg/security)

## 📜 Security Compliance

The SDK is designed to meet:

- **OWASP Top 10**: Web application security
- **NIST Cybersecurity Framework**: Security standards
- **SOC 2 Type II**: Security controls
- **PCI DSS**: Payment card security (when applicable)
- **GDPR**: Data protection (when handling personal data)

---

**Last Updated**: 2025-06-23  
**Version**: 2.0.0  
**Security Team**: RMZ Security Team <security@rmz.gg>