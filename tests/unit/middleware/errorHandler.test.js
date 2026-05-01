'use strict';

const { AppError, asyncHandler, notFoundHandler, globalErrorHandler } = require('../../../src/middleware/errorHandler');

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create an error with status code and code', () => {
      const error = new AppError('Test error', 400, 'BAD_REQUEST');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should default to 500 and INTERNAL_ERROR', () => {
      const error = new AppError('Server error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });

    it('should be an instance of Error', () => {
      const error = new AppError('test');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('asyncHandler', () => {
    it('should pass resolved values through', async () => {
      const handler = asyncHandler(async (_req, res) => res.json({ ok: true }));
      const req = {};
      const res = { json: jest.fn() };
      const next = jest.fn();
      await handler(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('should forward errors to next', async () => {
      const error = new Error('async fail');
      const handler = asyncHandler(async () => { throw error; });
      const next = jest.fn();
      await handler({}, {}, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with error details', () => {
      const req = { method: 'GET', originalUrl: '/missing' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      notFoundHandler(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'NOT_FOUND' }),
      }));
    });
  });

  describe('globalErrorHandler', () => {
    it('should return error status and message', () => {
      const err = new AppError('Bad request', 400, 'BAD_REQUEST');
      const req = { method: 'GET', originalUrl: '/test' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      globalErrorHandler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'BAD_REQUEST', message: 'Bad request' }),
      }));
      consoleSpy.mockRestore();
    });

    it('should default to 500 for unknown errors', () => {
      const err = new Error('unknown');
      const req = { method: 'POST', originalUrl: '/api' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      globalErrorHandler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      consoleSpy.mockRestore();
    });
  });
});
