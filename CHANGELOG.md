# Changelog

## [2.1.0] - 2024-12-26

### Added
- Smart retry logic with exponential backoff and Retry-After header support for rate limiting
- Improved error handling that prevents Next.js development error overlays
- Better environment detection for browser vs server environments

### Fixed
- Fixed excessive retry behavior for 4xx client errors (now only retries 408 and 429)
- Eliminated stack traces from HTTP errors to prevent Next.js error overlay issues
- Improved environment detection to prevent node-fetch resolution issues in browsers
- Reduced default retry attempts from 3 to 2 and delay from 1000ms to 500ms

### Changed
- HTTP errors now return plain objects instead of Error instances to avoid stack traces
- Environment detection prioritizes browser detection over server detection
- Simplified HTTP client fallback logic for better Next.js compatibility

## [2.0.5] - 2024-12-26

### Fixed
- **HTTP Client**: Fixed "Invalid response format" error by improving response parsing
- **Error Handling**: Enhanced error handling to properly expose `error.response.data.message` for better error access
- **Response Format**: Added support for both wrapped (`{data: ...}`) and direct response formats
- **JSON Parsing**: Improved JSON parsing with better error messages when parsing fails
- **Authentication**: Better handling of 401 errors with automatic token cleanup

### Changed
- **Response Handling**: Responses are now consistently wrapped in ApiResponse format for compatibility
- **Error Structure**: Errors now follow axios-style structure with `error.response.data` containing server response

## [2.0.4] - Previous version
... 