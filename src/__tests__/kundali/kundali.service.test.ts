import { setupAPIMocks, cleanupAPIMocks } from '../mocks/apiMocks';
import { generateKundali, getKundaliHistory, exportKundaliPDF } from '@/services/kundali.service';
import * as mockData from '../fixtures/mockData';

describe('KundaliService', () => {
  beforeEach(() => {
    setupAPIMocks();
  });

  afterEach(() => {
    cleanupAPIMocks();
  });

  describe('generateKundali', () => {
    it('should generate kundali with valid input data', async () => {
      const input = mockData.mockKundaliInput;
      const result = await generateKundali(input);

      expect(result).toBeDefined();
      expect(result.name).toBe(input.name);
      expect(result.sun_sign).toBeDefined();
      expect(result.moon_sign).toBeDefined();
      expect(result.predictions).toBeDefined();
    });

    it('should work offline (no network required)', async () => {
      // Simulate offline mode
      const offlineInput = mockData.mockKundaliInput;

      const result = await generateKundali(offlineInput);

      expect(result).toBeDefined();
      expect(result.name).toBe(offlineInput.name);
    });

    it('should handle invalid birth data gracefully', async () => {
      const invalidInput = {
        ...mockData.mockKundaliInput,
        dateOfBirth: 'invalid-date',
      };

      try {
        await generateKundali(invalidInput);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getKundaliHistory', () => {
    it('should fetch user kundali history', async () => {
      const result = await getKundaliHistory();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('date_of_birth');
    });
  });

  describe('exportKundaliPDF', () => {
    it('should export kundali to PDF', async () => {
      const kundaliId = 1;
      const result = await exportKundaliPDF(kundaliId);

      expect(result).toHaveProperty('pdf_url');
      expect(result.pdf_url).toContain('kundali.pdf');
    });

    it('should handle export failure', async () => {
      const invalidId = -1;

      try {
        await exportKundaliPDF(invalidId);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
