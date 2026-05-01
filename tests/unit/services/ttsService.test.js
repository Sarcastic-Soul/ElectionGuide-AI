'use strict';

jest.mock('@google-cloud/text-to-speech');

const textToSpeech = require('@google-cloud/text-to-speech');
const ttsService = require('../../../src/services/ttsService');

describe('TTS Service', () => {
  let mockSynthesizeSpeech, mockListVoices;

  beforeEach(() => {
    ttsService.resetClient();
    mockSynthesizeSpeech = jest.fn().mockResolvedValue([{ audioContent: Buffer.from('audio-data') }]);
    mockListVoices = jest.fn().mockResolvedValue([{ voices: [{ name: 'en-US-1', languageCodes: ['en-US'], ssmlGender: 'NEUTRAL' }] }]);

    textToSpeech.TextToSpeechClient.mockImplementation(() => ({
      synthesizeSpeech: mockSynthesizeSpeech,
      listVoices: mockListVoices,
    }));
  });

  afterEach(() => jest.clearAllMocks());

  describe('synthesize', () => {
    it('should return base64 audio', async () => {
      const result = await ttsService.synthesize('Hello world');
      expect(result).toBe(Buffer.from('audio-data').toString('base64'));
      expect(mockSynthesizeSpeech).toHaveBeenCalledWith(expect.objectContaining({
        input: { text: 'Hello world' },
        voice: expect.objectContaining({ languageCode: 'en-US' }),
        audioConfig: expect.objectContaining({ audioEncoding: 'MP3' }),
      }));
    });

    it('should use cache on second call', async () => {
      await ttsService.synthesize('cached text');
      await ttsService.synthesize('cached text');
      expect(mockSynthesizeSpeech).toHaveBeenCalledTimes(1);
    });

    it('should accept custom language and gender', async () => {
      await ttsService.synthesize('Hola', 'es-ES', 'FEMALE');
      expect(mockSynthesizeSpeech).toHaveBeenCalledWith(expect.objectContaining({
        voice: expect.objectContaining({ languageCode: 'es-ES', ssmlGender: 'FEMALE' }),
      }));
    });
  });

  describe('listVoices', () => {
    it('should return formatted voice list', async () => {
      const voices = await ttsService.listVoices('en-US');
      expect(voices).toHaveLength(1);
      expect(voices[0].name).toBe('en-US-1');
    });
  });
});
