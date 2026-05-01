# ──────────────────────────────────────────────────────────
# ElectionGuide AI — Multi-stage Production Dockerfile
# ──────────────────────────────────────────────────────────
#
# Design decisions:
# - Multi-stage build: Stage 1 installs deps, Stage 2 copies only production files.
#   This keeps the final image small (~200MB vs ~600MB with dev deps).
# - node:20-slim: Smaller base than node:20 (removes build tools we don't need).
# - Non-root user: Container runs as 'appuser' — never root. Prevents
#   container escape attacks from gaining host-level privileges.
# - npm ci --omit=dev: Installs exact versions from package-lock.json,
#   excluding test/lint dependencies. Ensures reproducible builds.
# - HEALTHCHECK: Cloud Run uses this to determine container readiness.
#   A 200 response from /health means the container is ready for traffic.
#
# Build: docker build -t electionguide-ai .
# Run:   docker run -p 8080:8080 -e GEMINI_API_KEY=your-key electionguide-ai
# ──────────────────────────────────────────────────────────

# Stage 1: Install production dependencies only
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production image (clean, minimal)
FROM node:20-slim

# Create non-root user for container security (CIS Docker Benchmark 4.1)
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/false appuser

WORKDIR /app

# Copy production dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source code
COPY src/ ./src/
COPY package.json ./

# Set ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user — NEVER run as root in production
USER appuser

# Cloud Run automatically injects PORT env var
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Start the server
CMD ["node", "src/server.js"]
