'use strict';

const request = require('supertest');
const { createApp } = require('../../src/app');

describe('Health & Timeline Integration', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /health', () => {
    it('should return 200 with status healthy', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.uptime).toBeDefined();
    });
  });

  describe('GET /api/timeline', () => {
    it('should return election timeline data', async () => {
      const res = await request(app).get('/api/timeline');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(8);
      expect(res.body.data[0]).toHaveProperty('step');
      expect(res.body.data[0]).toHaveProperty('icon');
    });

    it('should include Cache-Control headers for timeline', async () => {
      const res = await request(app).get('/api/timeline');
      expect(res.headers['cache-control']).toContain('public');
      expect(res.headers['cache-control']).toContain('max-age=3600');
    });
  });

  describe('GET /api/timeline/:step', () => {
    it('should return detailed step data', async () => {
      const res = await request(app).get('/api/timeline/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.step).toBe('Voter Registration');
      expect(res.body.data.details).toBeDefined();
      expect(res.body.data.keyFacts).toBeInstanceOf(Array);
    });

    it('should return 400 for invalid step', async () => {
      const res = await request(app).get('/api/timeline/99');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/translate/languages', () => {
    it('should return supported languages', async () => {
      const res = await request(app).get('/api/translate/languages');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(5);
    });
  });

  describe('CSRF Protection', () => {
    it('should set CSRF cookie and header on GET requests', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-csrf-token']).toBeDefined();
      expect(res.headers['x-csrf-token'].length).toBe(64); // 32 bytes hex
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject POST requests without CSRF token', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'test' });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });

    it('should accept POST requests with valid CSRF token', async () => {
      // First, get a CSRF token via any GET request
      const getRes = await request(app).get('/health');
      const cookies = getRes.headers['set-cookie'];

      // Extract csrf cookie value
      const csrfCookie = cookies.find((c) => c.startsWith('_csrf='));
      const csrfValue = csrfCookie.split('=')[1].split(';')[0];

      // POST with matching cookie and header — CSRF should pass
      // The request may fail downstream (400 for validation, etc.) but NOT 403
      const postRes = await request(app)
        .post('/api/translate')
        .set('Cookie', `_csrf=${csrfValue}`)
        .set('X-CSRF-Token', csrfValue)
        .set('Content-Type', 'application/json')
        .send({ text: 'hello', targetLanguage: 'es' });

      // Key assertion: CSRF did NOT block the request
      expect(postRes.status).not.toBe(403);
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown API routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Static files', () => {
    it('should serve index.html', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
    });

    it('should serve CSS', async () => {
      const res = await request(app).get('/css/styles.css');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/css');
    });
  });

  describe('Security headers', () => {
    it('should include security headers', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
    });
  });
});
