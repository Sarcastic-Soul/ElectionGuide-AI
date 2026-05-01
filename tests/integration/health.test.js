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
