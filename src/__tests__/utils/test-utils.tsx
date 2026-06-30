import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from '@/store/ThemeContext';

// Mock providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };

// Helper to wait for async operations
export const waitFor = async (callback: () => void, timeout = 3000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};

// Helper to flush promises
export const flushPromises = () =>
  new Promise((resolve) => setImmediate(resolve));

// Helper to advance timers and flush promises
export const advanceTimersAndFlush = async (ms: number) => {
  jest.advanceTimersByTime(ms);
  await flushPromises();
};
