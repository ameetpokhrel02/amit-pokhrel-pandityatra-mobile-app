const corePalette = {
  primary: '#f97316', // Saffron Orange
  background: '#fff7ed', // Cream
  surface: '#ffffff', // White
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  success: '#22c55e',
  danger: '#ef4444',
  border: '#e5e5e5',

  // Fallbacks for existing variables used in the app
  text: '#1A1A1A',
  card: '#ffffff',
  icon: '#666666',
  tint: '#f97316',
  placeholder: '#e5e5e5',
  lightGreen: '#22c55e',
  error: '#ef4444',
  inputBackground: '#ffffff',
  notification: '#f97316',
  tabIconDefault: '#666666',
  tabIconSelected: '#f97316',
  secondary: '#FFB300',
};

export const Colors = {
  light: {
    ...corePalette,
  },
  dark: {
    // The strict rule is "Background color = #fff7ed" 
    ...corePalette,
  },
};
