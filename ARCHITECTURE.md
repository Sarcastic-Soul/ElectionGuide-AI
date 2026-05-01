# Architecture

## System Overview

ElectionGuide AI follows a **layered server architecture** with clear separation of concerns:

```
┌──────────────────────────────────────────────────────────┐
│                    Client (Browser)                       │
│  Vanilla HTML/CSS/JS • SSE Streaming • ARIA Accessible   │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS (TLS terminated by Cloud Run)
┌──────────────────────┴───────────────────────────────────┐
│                  Middleware Pipeline                       │
│  Helmet → Compression → Logger → Parser → Rate Limit →   │
│  Sanitizer → [Routes] → 404 Handler → Error Handler     │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────────┐
│                   Service Layer                           │
│  GeminiService │ FirestoreService │ TTSService │          │
│  TranslateService │ LoggingService                       │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────────┐
│              Google Cloud Platform                        │
│  Gemini API │ Firestore │ TTS API │ Translation API │    │
│  Cloud Run │ Cloud Logging                               │
└──────────────────────────────────────────────────────────┘
```

## Design Patterns

### 1. Factory Pattern (app.js)
`createApp()` returns a fresh Express instance per call. This enables test isolation — each test suite gets its own middleware stack without shared state contamination.

### 2. Singleton with Reset (Services)
Each Google Cloud service client is lazily initialized as a singleton for connection reuse. A `resetClient()` method enables test isolation by allowing tests to inject mocked clients.

### 3. Async Error Boundary (Middleware)
`asyncHandler()` wraps all async route handlers, automatically catching rejected promises and forwarding them to the global error handler. This eliminates the need for try/catch in every route.

### 4. Defense-in-Depth (Security)
Five security layers work independently — if any single layer fails, the others still protect:
1. Helmet CSP headers
2. Rate limiting
3. Input sanitization (DOMPurify)
4. Input validation (express-validator)
5. Infrastructure security (non-root Docker, ADC auth)

### 5. Cache-Aside (Translation & TTS)
LRU caches sit in front of Google Cloud APIs. On cache miss, the service calls the API, stores the result, and returns it. On cache hit, the API is never called — reducing costs and latency.

## Data Flow: Chat Message

```
User types message → chat.js sends POST /api/chat
  → Express receives request
    → Helmet adds security headers
    → Rate limiter checks quota (429 if exceeded)
    → Input sanitizer strips HTML/XSS via DOMPurify
    → express-validator validates message length/type
    → chatRoutes.js calls geminiService.streamChat()
      → Gemini 2.5 Flash generates streaming response
      → Server writes SSE chunks: `data: {"type":"chunk","text":"..."}\n\n`
    → chat.js reads SSE stream, renders markdown in real-time
    → requestLogger logs: method, path, status, latency (JSON for Cloud Logging)
```

## Why These Technologies?

| Decision | Rationale |
|---|---|
| Express over Fastify | Largest middleware ecosystem, battle-tested, best Helmet/rate-limit integration |
| Vanilla JS over React | Zero build step, smaller Docker image, no framework overhead for simple SPA |
| LRU Cache over Redis | No additional infrastructure. For a single-container app, in-memory LRU is faster and simpler |
| SSE over WebSockets | Unidirectional streaming is correct for AI responses. SSE works through HTTP proxies and Cloud Run without config |
| Object.freeze on config | Prevents accidental runtime mutation of settings — a security best practice |
