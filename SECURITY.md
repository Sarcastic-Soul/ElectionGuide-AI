# Security

## Overview

ElectionGuide AI implements a **defense-in-depth** security architecture with five independent layers. If any single layer is bypassed, the remaining layers continue to protect the application.

## Security Layers

### Layer 1: HTTP Security Headers (Helmet.js)
**File**: `src/config/security.js`

| Header | Value | Purpose |
|---|---|---|
| Content-Security-Policy | `default-src 'self'` | Prevents XSS, data injection |
| Strict-Transport-Security | `max-age=31536000; preload` | Forces HTTPS |
| X-Frame-Options | `DENY` | Prevents clickjacking |
| X-Content-Type-Options | `nosniff` | Prevents MIME sniffing |
| Referrer-Policy | `strict-origin-when-cross-origin` | Controls referrer leakage |
| Cross-Origin-Opener-Policy | `same-origin` | Prevents cross-window attacks |

### Layer 2: Rate Limiting
**File**: `src/middleware/rateLimiter.js`

- **Global**: 100 requests / 15 minutes per IP
- **AI endpoints**: 20 requests / 15 minutes per IP
- Returns HTTP 429 with `Retry-After` header
- Prevents API abuse and cost escalation

### Layer 3: Input Sanitization
**File**: `src/middleware/inputSanitizer.js`

- Server-side DOMPurify via jsdom
- Strips ALL HTML tags and script content
- Recursive sanitization of nested objects and arrays
- Maximum input length enforcement
- Preserves Unicode/emoji safely

### Layer 4: Input Validation
**File**: `src/utils/validators.js`

- express-validator schemas on every API endpoint
- Type checking, length limits, enum validation
- Regex patterns for language codes (BCP-47)
- Structured error responses with field-level detail

### Layer 5: Infrastructure Security
- **Non-root Docker user**: Container runs as `appuser`, not root
- **Application Default Credentials**: No hardcoded API keys
- **Object.freeze**: Config immutable at runtime
- **ESLint rules**: `no-eval`, `no-implied-eval`, `no-new-func`
- **Stack trace suppression**: Production errors never expose internals
- **1MB body limit**: Prevents large payload attacks

## What We Do NOT Do
- ❌ No `eval()` or `new Function()` anywhere
- ❌ No `innerHTML` in client-side JavaScript
- ❌ No hardcoded credentials in source code
- ❌ No wildcard CORS (`Access-Control-Allow-Origin: *`)
- ❌ No sensitive data in error responses
- ❌ No user data collection or storage (privacy-first)
