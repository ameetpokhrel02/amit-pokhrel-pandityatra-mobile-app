import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getExchangeRate } from '@/services/payment.service';

export type Currency = 'NPR' | 'USD';

interface CurrencyState {
  currency: Currency;
  exchangeRate: number;
  setCurrency: (currency: Currency) => void;
  fetchExchangeRate: () => Promise<void>;
  convertAmount: (amountInNpr: number) => { amount: number; formatted: string };
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'NPR',
      exchangeRate: 0.0075, // Default fallback
      setCurrency: (currency) => set({ currency }),
      fetchExchangeRate: async () => {
        try {
          const data = await getExchangeRate();
          if (data && data.rate) {
            set({ exchangeRate: data.rate });
          }
        } catch (error) {
          console.error('Failed to fetch exchange rate:', error);
        }
      },
      convertAmount: (amountInNpr: number) => {
        const state = get();
        if (state.currency === 'USD') {
          const usdAmount = amountInNpr * state.exchangeRate;
          return {
            amount: usdAmount,
            formatted: `$${usdAmount.toFixed(2)}`,
          };
        }
        return {
          amount: amountInNpr,
          formatted: `Rs ${Math.round(amountInNpr)}`,
        };
      },
    }),
    {
      name: 'currency-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
