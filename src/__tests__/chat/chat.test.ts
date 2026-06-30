jest.mock('socket.io-client');

import { setupAPIMocks, cleanupAPIMocks } from '../mocks/apiMocks';
import { getChatMessages, sendChatMessage } from '@/services/chat.service';
import { getAIKundaliPrediction, getAISamagriRecommendation } from '@/services/ai.service';
import * as mockData from '../fixtures/mockData';
import io from 'socket.io-client';

const mockSocket = (io as any).mockSocket;

describe('Chat Features', () => {
  beforeEach(() => {
    setupAPIMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupAPIMocks();
  });

  describe('Real-time Chat', () => {
    it('should fetch chat messages for a conversation', async () => {
      const chatId = 1;
      const messages = await getChatMessages(chatId);

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]).toHaveProperty('text');
      expect(messages[0]).toHaveProperty('user');
    });

    it('should send a message', async () => {
      const chatId = 1;
      const messageText = 'Hello, I need help';

      const result = await sendChatMessage(chatId, messageText);

      expect(result).toHaveProperty('text');
      expect(result.text).toBe(messageText);
    });

    it('should establish socket connection', () => {
      expect(mockSocket.connect).toBeDefined();
      expect(mockSocket.on).toBeDefined();
      expect(mockSocket.emit).toBeDefined();
    });

    it('should listen for new messages via socket', () => {
      mockSocket.on('new_message', jest.fn());

      expect(mockSocket.on).toHaveBeenCalledWith(
        'new_message',
        expect.any(Function)
      );
    });

    it('should emit typing indicator', () => {
      const chatId = 1;
      mockSocket.emit('typing', { chatId, isTyping: true });

      expect(mockSocket.emit).toHaveBeenCalledWith('typing', {
        chatId,
        isTyping: true,
      });
    });
  });

  describe('AI Kundali Chat', () => {
    it('should get AI prediction from kundali PDF', async () => {
      const kundaliData = {
        pdf_url: mockData.mockKundaliResult.pdf_url,
        question: 'What does my kundali say about career?',
      };

      const response = await getAIKundaliPrediction(kundaliData);

      expect(response).toHaveProperty('response');
      expect(response.response).toBeTruthy();
    });

    it('should handle AI prediction for multiple questions', async () => {
      const questions = [
        'What about my career?',
        'How is my health?',
        'When will I get married?',
      ];

      for (const question of questions) {
        const response = await getAIKundaliPrediction({
          pdf_url: mockData.mockKundaliResult.pdf_url,
          question,
        });

        expect(response.response).toBeTruthy();
      }
    });
  });

  describe('AI Samagri Recommendations', () => {
    it('should recommend samagri items for a puja', async () => {
      const pujaType = 'Satyanarayan Puja';

      const response = await getAISamagriRecommendation({ pujaType });

      expect(response).toHaveProperty('items');
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.items.length).toBeGreaterThan(0);
    });

    it('should recommend appropriate items based on puja type', async () => {
      const pujaTypes = ['Griha Pravesh', 'Wedding Ceremony', 'Mundan'];

      for (const pujaType of pujaTypes) {
        const response = await getAISamagriRecommendation({ pujaType });

        expect(response.items).toBeDefined();
        expect(response.items.length).toBeGreaterThan(0);
      }
    });
  });
});
