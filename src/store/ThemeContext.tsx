import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/theme/colors';
import { DefaultTheme, DarkTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: typeof Colors.light;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  mode: 'system',
  setMode: () => {},
  colors: Colors.light,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let mounted = true;
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (mounted && savedMode) {
          setModeState(savedMode as ThemeMode);
        }
      } catch (e) {
        console.error('Failed to load theme', e);
      }
    };
    
    loadTheme();
    return () => { mounted = false; };
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem('themeMode', newMode);
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  };

  const activeThemeName = mode === 'system' ? (systemColorScheme || 'light') : mode;
  const themeName = activeThemeName === 'dark' ? 'dark' : 'light';
  const colors = Colors[themeName];

  const baseNavigationTheme = themeName === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.tint,
    },
  };

  return (
    <ThemeContext.Provider value={{ theme: themeName, mode, setMode, colors }}>
      <NavigationThemeProvider value={navigationTheme}>
        {children}
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
};
