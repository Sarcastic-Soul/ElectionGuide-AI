'use strict';

const { getValidationErrors, successResponse, truncateText, retryWithBackoff } = require('../../../src/utils/helpers');

describe('Helpers', () => {
  describe('successResponse', () => {
    it('should format a success response', () => {
      const result = successResponse({ id: 1 }, 'Created');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Created');
      expect(result.data).toEqual({ id: 1 });
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('truncateText', () => {
    it('should not truncate short text', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('should truncate long text with ellipsis', () => {
      expect(truncateText('Hello World', 8)).toBe('Hello...');
    });
  });

  describe('retryWithBackoff', () => {
    it('should return on first success', async () => {
      const fn = jest.fn().mockResolvedValue('ok');
      const result = await retryWithBackoff(fn, 3, 10);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('ok');
      const result = await retryWithBackoff(fn, 3, 10);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('always fails'));
      await expect(retryWithBackoff(fn, 2, 10)).rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });
});
