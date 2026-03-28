const corePalette = {
  primary: '#f97316', // Saffron Orange
  background: '#fff7ed', // Cream
  surface: '#ffffff', // White
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  success: '#22c55e',
  danger: '#ef4444',
  border: '#e5e5e5',
  
  // Aliased for backward compatibility with existing usage like 'colors.text' or 'colors.card'
  text: '#1A1A1A',
  card: '#ffffff',
  icon: '#666666',
  tint: '#f97316',
  placeholder: '#e5e5e5',
  lightGreen: '#22c55e',
};

export const Colors = {
  light: {
    ...corePalette,
  },
  dark: {
    // Implementing strict cream/saffron rules means forcing this regardless of dark mode 
    // or adapting dark mode to have the same consistent core but inverted surface states if requested.
    // The user rules strictly requested "background color = #fff7ed" with NO exceptions noted for dark mode, 
    // so we map dark directly to light for unifying the brand requirement.
    ...corePalette,
  },
};
