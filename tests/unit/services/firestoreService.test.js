'use strict';

jest.mock('@google-cloud/firestore');

const { Firestore } = require('@google-cloud/firestore');
const firestoreService = require('../../../src/services/firestoreService');

describe('Firestore Service', () => {
  let mockCollection, mockAdd, mockGet, mockOrderBy, mockLimit;

  beforeEach(() => {
    firestoreService.resetDb();
    mockAdd = jest.fn().mockResolvedValue({ id: 'doc123' });
    mockGet = jest.fn().mockResolvedValue({
      docs: [
        { id: 'doc1', data: () => ({ percentage: 90, sessionId: 's1', createdAt: { toDate: () => new Date() } }) },
        { id: 'doc2', data: () => ({ percentage: 80, sessionId: 's2', createdAt: { toDate: () => new Date() } }) },
      ],
    });
    mockLimit = jest.fn().mockReturnValue({ get: mockGet });
    mockOrderBy = jest.fn().mockReturnValue({ orderBy: jest.fn().mockReturnValue({ limit: mockLimit }) });
    mockCollection = jest.fn().mockReturnValue({
      add: mockAdd,
      orderBy: mockOrderBy,
      get: mockGet,
    });

    Firestore.mockImplementation(() => ({ collection: mockCollection }));
    Firestore.FieldValue = { serverTimestamp: jest.fn().mockReturnValue('SERVER_TIMESTAMP') };
  });

  afterEach(() => jest.clearAllMocks());

  describe('saveQuizResult', () => {
    it('should save a quiz result and return document ID', async () => {
      const result = await firestoreService.saveQuizResult({
        sessionId: 'test-session',
        topic: 'Electoral College',
        score: 4,
        total: 5,
        percentage: 80,
      });

      expect(result).toBe('doc123');
      expect(mockCollection).toHaveBeenCalledWith('quiz_results');
      expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
        sessionId: 'test-session',
        score: 4,
        createdAt: 'SERVER_TIMESTAMP',
      }));
    });
  });

  describe('getLeaderboard', () => {
    it('should return sorted quiz results', async () => {
      const results = await firestoreService.getLeaderboard(10);
      expect(mockCollection).toHaveBeenCalledWith('quiz_results');
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('doc1');
    });
  });

  describe('logAnalyticsEvent', () => {
    it('should log an analytics event', async () => {
      const id = await firestoreService.logAnalyticsEvent('chat', { messageLength: 50 });
      expect(id).toBe('doc123');
      expect(mockCollection).toHaveBeenCalledWith('analytics');
    });
  });
});
