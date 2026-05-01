'use strict';

jest.mock('@google-cloud/translate');

const { Translate } = require('@google-cloud/translate').v2;
const translateService = require('../../../src/services/translateService');

describe('Translate Service', () => {
  let mockTranslate, mockDetect, mockGetLanguages;

  beforeEach(() => {
    translateService.resetClient();
    mockTranslate = jest.fn().mockResolvedValue(['Hola mundo']);
    mockDetect = jest.fn().mockResolvedValue([{ language: 'en', confidence: 0.99 }]);
    mockGetLanguages = jest.fn().mockResolvedValue([[{ code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' }]]);

    Translate.mockImplementation(() => ({
      translate: mockTranslate,
      detect: mockDetect,
      getLanguages: mockGetLanguages,
    }));
  });

  afterEach(() => jest.clearAllMocks());

  describe('translateText', () => {
    it('should translate text and return result', async () => {
      const result = await translateService.translateText('Hello world', 'es');
      expect(result.translatedText).toBe('Hola mundo');
      expect(result.sourceLanguage).toBe('en');
      expect(result.targetLanguage).toBe('es');
      expect(result.fromCache).toBe(false);
    });

    it('should return cached result on second call', async () => {
      await translateService.translateText('Hello world', 'es');
      const result = await translateService.translateText('Hello world', 'es');
      expect(result.fromCache).toBe(true);
      expect(mockTranslate).toHaveBeenCalledTimes(1);
    });
  });

  describe('detectLanguage', () => {
    it('should detect language', async () => {
      const result = await translateService.detectLanguage('Hello');
      expect(result.language).toBe('en');
      expect(result.confidence).toBe(0.99);
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return languages list', async () => {
      const result = await translateService.getSupportedLanguages();
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('es');
    });
  });

  describe('translateBatch', () => {
    it('should translate multiple texts', async () => {
      const results = await translateService.translateBatch(['Hello', 'World'], 'es');
      expect(results).toHaveLength(2);
    });
  });
});
