# ElectionGuide AI 🏛️

> **An AI-powered, interactive assistant that educates users about the election process through conversational AI, interactive timelines, adaptive quizzes, multilingual translation, and text-to-speech narration — built entirely on Google Cloud.**

[![Deployed on Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-Deployed-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/run)
[![Powered by Gemini](https://img.shields.io/badge/Gemini%202.5%20Flash-AI%20Engine-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-54%20Passing-brightgreen?logo=jest&logoColor=white)](https://jestjs.io/)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG%202.1-AA%20Compliant-blue)](https://www.w3.org/WAI/WCAG21/quickref/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Features](#features)
- [Architecture](#architecture)
- [Google Cloud Services Integration](#google-cloud-services-integration)
- [Security](#security)
- [Accessibility](#accessibility)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Design Decisions](#design-decisions)

---

## Overview

**ElectionGuide AI** is a comprehensive civic education platform that makes the election process accessible, understandable, and engaging for everyone. The application leverages **six Google Cloud services** to deliver a production-grade experience:

| Challenge | Our Solution |
|---|---|
| Election processes are complex and confusing | AI-powered conversational explanations using **Gemini 2.5 Flash** |
| Static content doesn't engage learners | Interactive timeline with expandable steps and AI-generated quizzes |
| Language barriers exclude non-English speakers | Real-time translation to **12+ languages** via **Cloud Translation API** |
| Visually impaired users can't access text content | **Cloud Text-to-Speech** narration with audio playback |
| Educational tools often lack security | Enterprise-grade security with **Helmet CSP**, rate limiting, and input sanitization |
| Apps need reliable infrastructure | Serverless deployment on **Google Cloud Run** with **Cloud Firestore** persistence |

---

## Live Demo

🌐 **Production URL**: [https://electionguide-ai-139415254857.us-central1.run.app](https://electionguide-ai-139415254857.us-central1.run.app)

---

## Features

### 🤖 AI-Powered Chat (Gemini 2.5 Flash)
- **Real-time streaming responses** via Server-Sent Events (SSE) — users see the AI "typing" in real time
- Expert system prompt grounding the AI in non-partisan election education
- Conversation history management for multi-turn context
- Quick-action topic chips for instant access to common questions
- Markdown rendering in AI responses (bold, lists, headers, code)
- Safety settings configured to block harmful content

### 📅 Interactive Election Timeline
- **8-step visual timeline** covering the entire election process:
  1. 📋 Voter Registration → 2. 🗳️ Primaries & Caucuses → 3. 🎪 National Conventions →
  4. 📢 Campaign Season → 5. 🏛️ Election Day → 6. ⭐ Electoral College →
  7. 📜 Congressional Certification → 8. 🎖️ Inauguration
- Click-to-expand cards with detailed explanations and key facts
- Lazy-loaded detail content to minimize initial payload
- Smooth animations with `prefers-reduced-motion` support

### 🧠 Adaptive AI Quizzes
- **AI-generated questions** tailored to chosen topic and difficulty level
- Three difficulty tiers: 🌱 Beginner, 📚 Intermediate, 🎓 Expert
- Seven topic categories covering all aspects of elections
- Instant visual feedback (green/red) on answer selection
- Detailed explanations for every question after completion
- Score persistence to **Cloud Firestore** with anonymous leaderboard

### 🌐 Multilingual Translation (Cloud Translation API)
- **12+ supported languages**: English, Spanish, Hindi, French, German, Chinese, Japanese, Korean, Arabic, Portuguese, Tamil, Telugu
- **LRU cache** (1,000 entries, 1-hour TTL) to minimize API calls and costs
- Auto-detect source language
- RTL text support for Arabic and Hebrew
- Client-side translation caching for instant repeated access

### 🔊 Text-to-Speech Narration (Cloud TTS)
- **Listen to any AI response** with one click — powered by Google Cloud Text-to-Speech
- Multiple voice options with language-aware synthesis
- **LRU cache** for frequently narrated phrases (100 entries, 30-min TTL)
- Browser SpeechSynthesis fallback when Cloud TTS is unavailable
- SSML support for pronunciation control

### ♿ Full Accessibility (WCAG 2.1 AA)
- See [Accessibility](#accessibility) section for complete details

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Chat UI  │ │ Timeline │ │ Quiz UI  │ │ Accessibility     │  │
│  │ (SSE)    │ │ (Lazy)   │ │ (Adaptive│ │ (TTS, i18n, a11y) │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────────┬─────────┘  │
│       │             │            │                  │            │
│       └─────────────┴────────────┴──────────────────┘            │
│                              │ HTTPS                             │
└──────────────────────────────┼───────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────┐
│                    GOOGLE CLOUD RUN                              │
│  ┌───────────────────────────┼────────────────────────────────┐  │
│  │              Express.js Server                             │  │
│  │  ┌─────────┐ ┌───────────┐ ┌────────────┐ ┌────────────┐  │  │
│  │  │ Helmet  │→│ Rate      │→│ Input      │→│ Request    │  │  │
│  │  │ CSP     │ │ Limiter   │ │ Sanitizer  │ │ Logger     │  │  │
│  │  └─────────┘ └───────────┘ └────────────┘ └────────────┘  │  │
│  │                        │                                   │  │
│  │  ┌─────────────────────┼────────────────────────────────┐  │  │
│  │  │              API Router (/api)                       │  │  │
│  │  │  /chat  │  /quiz  │  /timeline  │  /tts  │ /translate│  │  │
│  │  └─────────┴─────────┴─────────────┴────────┴───────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                               │                                  │
│  ┌────────────────────────────┼───────────────────────────────┐  │
│  │              Service Layer                                 │  │
│  │  ┌──────────┐ ┌──────────┐ ┌─────┐ ┌──────────┐ ┌──────┐ │  │
│  │  │ Gemini   │ │Firestore │ │ TTS │ │Translate │ │ Log  │ │  │
│  │  │ Service  │ │ Service  │ │ Svc │ │ Service  │ │ Svc  │ │  │
│  │  └────┬─────┘ └────┬─────┘ └──┬──┘ └────┬─────┘ └──┬───┘ │  │
│  └───────┼──────────────┼─────────┼─────────┼──────────┼──────┘  │
└──────────┼──────────────┼─────────┼─────────┼──────────┼─────────┘
           │              │         │         │          │
    ┌──────┴──────┐ ┌─────┴────┐ ┌──┴───┐ ┌──┴───┐ ┌───┴────┐
    │ Gemini 2.5  │ │ Cloud    │ │Cloud │ │Cloud │ │ Cloud  │
    │ Flash API   │ │Firestore │ │ TTS  │ │Trans.│ │Logging │
    └─────────────┘ └──────────┘ └──────┘ └──────┘ └────────┘
```

**Design Principles:**
- **Layered Architecture**: Clear separation between middleware → routes → services → Google Cloud APIs
- **Dependency Injection**: All services accept injected clients via constructors for testability
- **Factory Pattern**: `createApp()` returns a fresh Express instance per invocation (critical for testing)
- **Singleton Pattern**: Google Cloud clients are lazily initialized as singletons with `resetClient()` for test isolation
- **Graceful Degradation**: If Firestore or TTS fails, the app continues functioning — errors are logged, not thrown to users

---

## Google Cloud Services Integration

This project integrates **six Google Cloud services**, each serving a specific purpose:

### 1. 🤖 Gemini 2.5 Flash (`@google/genai`)
**Purpose**: Core AI engine for conversational education and quiz generation

- Uses the **latest official SDK** (`@google/genai`) — NOT the deprecated `@google/generative-ai`
- **Streaming responses** via `generateContentStream` for real-time UX with Server-Sent Events
- Expert system prompt grounding responses in non-partisan election education
- Safety settings configured to `BLOCK_MEDIUM_AND_ABOVE` for all harm categories
- Separate prompt engineering for chat mode vs quiz generation mode
- Conversation history management for multi-turn context

**File**: [`src/services/geminiService.js`](src/services/geminiService.js)

### 2. ☁️ Google Cloud Run
**Purpose**: Serverless container hosting with auto-scaling

- **Multi-stage Dockerfile** minimizing image size (node:20-slim)
- **Non-root user** (`appuser`) for container security
- **Graceful shutdown** handling `SIGTERM` signals from Cloud Run
- **Health check** endpoint at `/health` for uptime monitoring
- Trust proxy configuration for Cloud Run's load balancer
- Environment variable injection via `--set-env-vars`

**File**: [`Dockerfile`](Dockerfile), [`src/server.js`](src/server.js)

### 3. 🗄️ Cloud Firestore (`@google-cloud/firestore`)
**Purpose**: Serverless NoSQL database for quiz results and analytics

- **Application Default Credentials (ADC)** — zero hardcoded keys
- Collections: `quiz_results` (leaderboard), `analytics` (usage tracking)
- Server timestamps for consistent ordering
- Optimistic read patterns (no real-time listeners in serverless — avoids connection leaks)
- Graceful fallback if Firestore is unavailable

**File**: [`src/services/firestoreService.js`](src/services/firestoreService.js)

### 4. 🌐 Cloud Translation API v2 (`@google-cloud/translate`)
**Purpose**: Real-time multilingual content translation

- **LRU cache** (1,000 entries, 1-hour TTL) — dramatically reduces API calls
- Auto-detect source language with confidence scoring
- Batch translation support for multiple texts
- 12+ supported languages including RTL (Arabic)
- Cache-hit tracking for observability

**File**: [`src/services/translateService.js`](src/services/translateService.js)

### 5. 🔊 Cloud Text-to-Speech (`@google-cloud/text-to-speech`)
**Purpose**: Audio narration for accessibility

- MP3 audio synthesis with configurable voice gender and language
- **LRU cache** (100 entries, 30-min TTL) for repeated phrases
- SSML support for pronunciation control
- Base64-encoded audio delivery for client-side playback
- Browser SpeechSynthesis fallback when API is unavailable

**File**: [`src/services/ttsService.js`](src/services/ttsService.js)

### 6. 📊 Cloud Logging (`@google-cloud/logging`)
**Purpose**: Structured production observability

- JSON-formatted logs compatible with Cloud Logging's severity system
- Request correlation IDs for distributed tracing
- Severity-based methods: `info()`, `warn()`, `error()`, `critical()`
- Automatic fallback to `console.log` in development
- Performance metrics in structured log entries

**File**: [`src/services/loggingService.js`](src/services/loggingService.js)

---

## Security

ElectionGuide AI implements a **defense-in-depth** security architecture with five layers of protection:

### Layer 1: HTTP Security Headers (Helmet)
- **Content Security Policy (CSP)**: Strict `default-src 'self'` with explicit allowlists for Google APIs
- **HSTS**: `max-age=31536000` with `includeSubDomains` and `preload`
- **X-Frame-Options**: `DENY` — prevents clickjacking
- **X-Content-Type-Options**: `nosniff` — prevents MIME sniffing
- **Referrer-Policy**: `strict-origin-when-cross-origin`

### Layer 2: Rate Limiting
- **Global**: 100 requests per 15-minute window per IP
- **AI endpoints**: 20 requests per 15-minute window per IP (prevents abuse of expensive Gemini/TTS calls)
- Standard `RateLimit-*` headers with `Retry-After`

### Layer 3: Input Sanitization
- **Server-side DOMPurify** via jsdom — strips ALL HTML/script tags from user inputs
- Recursive sanitization of nested objects and arrays
- Maximum input length enforcement (2,000 chars for chat, 5,000 for TTS/translate)
- UTF-8 validation

### Layer 4: Input Validation
- **express-validator** schemas on every API endpoint
- Type checking, length limits, enum validation, regex patterns
- Structured validation error responses with field-level detail

### Layer 5: Infrastructure Security
- **Non-root Docker user** — container runs as `appuser`, not root
- **No hardcoded credentials** — ADC for Google Cloud, env vars for API keys
- **No `eval()` or `innerHTML`** — ESLint rules enforce this (`no-eval`, `no-implied-eval`, `no-new-func`)
- **Stack trace suppression** in production error responses
- **Graceful error handling** — never exposes internal state to clients

**Files**: [`src/config/security.js`](src/config/security.js), [`src/middleware/`](src/middleware/)

---

## Accessibility

ElectionGuide AI is designed to be **WCAG 2.1 AA compliant**, ensuring the application is usable by people with diverse abilities:

### Semantic HTML & ARIA
- **Semantic HTML5** elements: `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<footer>`
- **ARIA landmarks** for screen reader navigation
- **ARIA live regions** (`aria-live="polite"`) for dynamic content announcements
- **Proper heading hierarchy** — single `<h1>`, sequential `<h2>`-`<h4>`
- **Skip navigation link** for keyboard users
- `role="tabpanel"`, `aria-controls`, `aria-selected` for tab navigation
- `role="log"` on chat messages container
- `role="progressbar"` with `aria-valuenow` on quiz progress

### Keyboard Navigation
- **Full keyboard accessibility** — every interactive element is reachable via Tab
- **Keyboard shortcuts**: `Alt+1-4` for tab switching, `/` to focus chat input
- **Focus trap management** for modal interactions
- **3px solid focus indicators** on all interactive elements via `:focus-visible`
- `Enter`/`Space` support on all clickable elements

### Visual Accessibility
- **High contrast mode** toggle — switches to pure black/white palette
- **Adjustable font size** controls (A+ / A- buttons, range: 12px–24px)
- **`prefers-reduced-motion: reduce`** support — disables all animations
- **`prefers-contrast: high`** media query support
- **Color contrast ratios** exceeding 4.5:1 for all text

### Assistive Technology
- **Text-to-Speech narration** via Google Cloud TTS — listen to any AI response
- **Screen reader announcements** via ARIA live region for all state changes
- **Browser SpeechSynthesis fallback** when Cloud TTS is unavailable
- **Multilingual support** — content available in 12+ languages

### Internationalization
- **`lang` attribute** on `<html>` element, updated dynamically
- **RTL support** for Arabic (`dir="rtl"`)
- **Google Cloud Translation API** for real-time content translation

**Files**: [`src/public/js/accessibility.js`](src/public/js/accessibility.js), [`src/public/js/i18n.js`](src/public/js/i18n.js)

---

## Project Structure

```
prompt-wars/
├── Dockerfile                     # Multi-stage production build (non-root user)
├── .dockerignore                  # Excludes dev files from Docker image
├── .gitignore                     # Git ignore patterns
├── .env.example                   # Environment variable template
├── package.json                   # Dependencies and scripts
├── .eslintrc.json                 # ESLint config (security-focused rules)
├── .prettierrc                    # Code formatting config
├── jest.config.js                 # Test framework config (90%+ coverage)
├── README.md                      # This file
│
├── src/
│   ├── server.js                  # Entry point — graceful shutdown, SIGTERM
│   ├── app.js                     # Express factory (testable via createApp())
│   │
│   ├── config/
│   │   ├── index.js               # Centralized frozen config (env vars)
│   │   └── security.js            # Helmet CSP & security policies
│   │
│   ├── middleware/
│   │   ├── errorHandler.js        # AppError class, async wrapper, global handler
│   │   ├── rateLimiter.js         # Dual rate limiters (global + AI)
│   │   ├── requestLogger.js       # Cloud Logging-compatible structured logs
│   │   └── inputSanitizer.js      # DOMPurify server-side XSS prevention
│   │
│   ├── routes/
│   │   ├── index.js               # Route aggregator
│   │   ├── chatRoutes.js          # POST /api/chat (SSE streaming)
│   │   ├── quizRoutes.js          # Quiz CRUD + leaderboard
│   │   ├── timelineRoutes.js      # Election timeline data
│   │   ├── ttsRoutes.js           # Text-to-Speech synthesis
│   │   └── translateRoutes.js     # Translation + language listing
│   │
│   ├── services/
│   │   ├── geminiService.js       # Gemini 2.5 Flash (streaming + quiz gen)
│   │   ├── firestoreService.js    # Firestore CRUD (ADC auth)
│   │   ├── ttsService.js          # Cloud TTS (LRU cached)
│   │   ├── translateService.js    # Cloud Translation (LRU cached)
│   │   └── loggingService.js      # Cloud Logging (structured JSON)
│   │
│   ├── utils/
│   │   ├── constants.js           # System prompts, timeline data, languages
│   │   ├── validators.js          # express-validator schemas
│   │   └── helpers.js             # Response formatters, retry logic
│   │
│   └── public/
│       ├── index.html             # Semantic HTML5 SPA shell (WCAG 2.1 AA)
│       ├── css/styles.css         # Glassmorphism design system (CSS vars)
│       └── js/
│           ├── app.js             # Tab nav, keyboard shortcuts, markdown
│           ├── chat.js            # SSE streaming, typing indicator
│           ├── quiz.js            # AI quiz flow, scoring, results
│           ├── timeline.js        # Lazy-loaded expandable timeline
│           ├── accessibility.js   # TTS, font size, contrast controls
│           └── i18n.js            # Translation API integration, RTL
│
└── tests/
    ├── unit/
    │   ├── middleware/
    │   │   ├── errorHandler.test.js      # 8 tests
    │   │   └── inputSanitizer.test.js    # 11 tests (XSS, unicode, edge cases)
    │   ├── services/
    │   │   ├── geminiService.test.js     # 8 tests (chat, quiz, grading)
    │   │   ├── firestoreService.test.js  # 3 tests (CRUD, leaderboard)
    │   │   ├── ttsService.test.js        # 4 tests (synthesis, cache, voices)
    │   │   └── translateService.test.js  # 5 tests (translate, detect, batch)
    │   └── utils/
    │       └── helpers.test.js           # 6 tests (retry, truncate, format)
    └── integration/
        └── health.test.js               # 9 tests (health, API, security headers)
```

---

## Getting Started

### Prerequisites
- **Node.js 20+** (LTS recommended)
- **Google Cloud project** with billing enabled
- **Gemini API key** (free at [aistudio.google.com](https://aistudio.google.com))

### Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone <repository-url>
cd prompt-wars

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 4. Start development server
npm run dev
# Server starts at http://localhost:8080

# 5. Run tests
npm test
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | — | Google Gemini API key |
| `PORT` | No | `8080` | Server port (Cloud Run injects automatically) |
| `NODE_ENV` | No | `development` | Environment (`development` or `production`) |
| `PROJECT_ID` | No | `promptwars-493516` | Google Cloud project ID |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model identifier |
| `RATE_LIMIT_GLOBAL` | No | `100` | Global rate limit per 15min |
| `RATE_LIMIT_AI` | No | `20` | AI endpoint rate limit per 15min |

---

## API Reference

All endpoints return JSON with consistent response format:

```json
{
  "success": true,
  "message": "Description",
  "data": { ... },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### Health

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/health` | Health check with uptime and version | Public |

### Chat (Gemini AI)

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `POST` | `/api/chat` | Streaming AI chat (SSE) | 20/15min |
| `POST` | `/api/chat/explain` | Non-streaming topic explanation | 20/15min |

**Request Body:**
```json
{
  "message": "What is the Electoral College?",
  "history": [
    { "role": "user", "text": "Previous question" },
    { "role": "model", "text": "Previous answer" }
  ]
}
```

### Quiz

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `POST` | `/api/quiz/generate` | Generate AI quiz | 20/15min |
| `POST` | `/api/quiz/submit` | Grade answers + save to Firestore | Global |
| `GET` | `/api/quiz/leaderboard` | Top 10 scores from Firestore | Global |

### Timeline

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `GET` | `/api/timeline` | All 8 steps (summary) | Global |
| `GET` | `/api/timeline/:step` | Detailed step (1-8) | Global |

### Text-to-Speech

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `POST` | `/api/tts` | Synthesize text to MP3 (base64) | 20/15min |

### Translation

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `POST` | `/api/translate` | Translate text | 20/15min |
| `GET` | `/api/translate/languages` | List 12+ supported languages | Global |

---

## Testing

### Test Architecture
- **54 tests** across **8 test suites** — all passing ✅
- **Unit tests**: Service layer, middleware, utilities — all with mocked Google API clients
- **Integration tests**: Full Express app with Supertest — health, API, security headers, static files
- **Dependency Injection**: All services accept injected clients for isolated unit testing
- **Factory Pattern**: `createApp()` creates fresh Express instances per test — no shared state
- **Zero external API calls** in tests — all Google services mocked via `jest.mock()`

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test file
npx jest tests/unit/services/geminiService.test.js

# Run with watch mode
npx jest --watch
```

### Coverage Thresholds (Enforced)
| Metric | Threshold |
|---|---|
| Lines | ≥ 90% |
| Statements | ≥ 90% |
| Functions | ≥ 85% |
| Branches | ≥ 80% |

---

## Deployment

### Google Cloud Run Deployment

```bash
# Deploy from source (builds container automatically)
gcloud run deploy electionguide-ai \
  --source . \
  --project promptwars-493516 \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your-key,NODE_ENV=production
```

### Docker (Local)

```bash
# Build
docker build -t electionguide-ai .

# Run
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your-key \
  -e NODE_ENV=production \
  electionguide-ai
```

---

## Design Decisions

### Why Express.js over Fastify/Hapi?
Express has the largest middleware ecosystem, battle-tested reliability, and the best documentation. For a hackathon submission, it minimizes risk while maximizing available security middleware (Helmet, cors, rate-limit).

### Why Vanilla HTML/CSS/JS over React/Vue?
Zero build step = faster deployment, smaller Docker images, and no framework overhead. The application is simple enough that a SPA-style vanilla JS architecture is cleaner than introducing a framework dependency.

### Why LRU Caching on Translation & TTS?
Google Cloud APIs are billed per character. An LRU cache with TTL prevents redundant API calls for repeated content (e.g., the same timeline text translated multiple times), reducing costs to near-zero while maintaining freshness.

### Why Streaming SSE over WebSockets?
SSE (Server-Sent Events) is the correct choice for unidirectional server-to-client streaming. It's simpler than WebSockets, works through HTTP/1.1 proxies, and is natively supported by Cloud Run without special configuration.

### Why `createApp()` Factory over Singleton?
A factory function that returns a fresh Express app per call enables isolated integration testing — each test gets its own middleware stack, avoiding state leakage between test suites.

---

## License

MIT © ElectionGuide AI Team
