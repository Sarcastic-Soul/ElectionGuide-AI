'use strict';

jest.mock('@google/genai');
jest.mock('../../../src/services/secretService', () => ({
  getSecret: jest.fn().mockResolvedValue('test-api-key'),
  resetClient: jest.fn(),
}));

const { GoogleGenAI } = require('@google/genai');
const geminiService = require('../../../src/services/geminiService');

describe('Gemini Service', () => {
  const mockGenerateContent = jest.fn();
  const mockGenerateContentStream = jest.fn();

  beforeEach(() => {
    geminiService.resetClient();
    process.env.GEMINI_API_KEY = 'test-api-key';

    GoogleGenAI.mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
        generateContentStream: mockGenerateContentStream,
      },
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  describe('chat', () => {
    it('should send a message and return response text', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'The Electoral College is...' });

      const result = await geminiService.chat('What is the Electoral College?');
      expect(result).toBe('The Electoral College is...');
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          contents: expect.arrayContaining([
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      );
    });

    it('should include conversation history', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Follow-up answer' });

      const history = [
        { role: 'user', text: 'Previous question' },
        { role: 'model', text: 'Previous answer' },
      ];

      await geminiService.chat('Follow-up', history);
      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toHaveLength(3);
    });

    it('should return empty string if no text in response', async () => {
      mockGenerateContent.mockResolvedValue({ text: undefined });
      const result = await geminiService.chat('test');
      expect(result).toBe('');
    });
  });

  describe('generateQuiz', () => {
    it('should parse valid JSON quiz response', async () => {
      const quizData = {
        title: 'Test Quiz',
        questions: [{ id: 1, question: 'Q1?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'Because A' }],
      };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(quizData) });

      const result = await geminiService.generateQuiz('voting', 'beginner', 1);
      expect(result.title).toBe('Test Quiz');
      expect(result.questions).toHaveLength(1);
    });

    it('should extract JSON from markdown code blocks', async () => {
      const quizData = { title: 'Quiz', questions: [] };
      mockGenerateContent.mockResolvedValue({ text: '```json\n' + JSON.stringify(quizData) + '\n```' });

      const result = await geminiService.generateQuiz('voting', 'beginner');
      expect(result.title).toBe('Quiz');
    });

    it('should throw on invalid JSON', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'not json' });
      await expect(geminiService.generateQuiz('test', 'beginner')).rejects.toThrow('Failed to parse');
    });
  });

  describe('gradeQuiz', () => {
    it('should correctly grade answers', async () => {
      const questions = [
        { id: 1, question: 'Q1?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'A is correct' },
        { id: 2, question: 'Q2?', options: ['A', 'B', 'C', 'D'], correctIndex: 2, explanation: 'C is correct' },
      ];
      const userAnswers = [0, 1]; // First correct, second wrong

      const result = await geminiService.gradeQuiz(questions, userAnswers);
      expect(result.score).toBe(1);
      expect(result.total).toBe(2);
      expect(result.percentage).toBe(50);
      expect(result.results[0].isCorrect).toBe(true);
      expect(result.results[1].isCorrect).toBe(false);
    });

    it('should provide appropriate feedback for high scores', async () => {
      const questions = [{ id: 1, question: 'Q?', options: ['A','B','C','D'], correctIndex: 0, explanation: 'A' }];
      const result = await geminiService.gradeQuiz(questions, [0]);
      expect(result.percentage).toBe(100);
      expect(result.feedback).toContain('Excellent');
    });
  });
});
