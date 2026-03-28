/**
 * PanditYatra Typography System
 *
 * Primary font: Roboto (Google Fonts) — used for all UI text
 * Accent font:  Lato — used for branding headings and display text
 *
 * All font variants map to loaded Expo font keys:
 *   'Roboto-Regular', 'Roboto-Medium', 'Roboto-Bold', 'Roboto-Light'
 *   'Lato-Regular',   'Lato-Bold',     'Lato-Italic'
 *
 * Usage:
 *   import { Typography } from '@/constants/Typography';
 *   <Text style={Typography.h1}>Title</Text>
 *   <Text style={[Typography.body, { color: '#f97316' }]}>Body</Text>
 */

import { TextStyle } from 'react-native';

// ─── Font Family Constants ────────────────────────────────────────────────────

export const FontFamily = {
  // Roboto — Primary UI font
  regular: 'Roboto-Regular',
  medium: 'Roboto-Medium',
  bold: 'Roboto-Bold',
  light: 'Roboto-Light',

  // Lato — Accent / display font
  accentRegular: 'Lato-Regular',
  accentBold: 'Lato-Bold',
  accentItalic: 'Lato-Italic',
} as const;

// ─── Font Size Scale ──────────────────────────────────────────────────────────

export const FontSize = {
  xs: 10,   // Badge text, timestamp
  sm: 12,   // Caption, metadata
  base: 14, // Label, subtitle, small body
  md: 16,   // Body text (default)
  lg: 18,   // Large body, card title
  xl: 20,   // Section heading
  xxl: 24,  // Page section title
  display: 28, // Screen title
  hero: 36, // Splash / hero display
} as const;

// ─── Line Height Scale ────────────────────────────────────────────────────────

export const LineHeight = {
  tight: 1.2,   // Headings
  normal: 1.5,  // Body
  relaxed: 1.75, // Long-form reading
};

// ─── Typography Presets ───────────────────────────────────────────────────────

export const Typography: Record<string, TextStyle> = {
  /**
   * HEADINGS
   * Use Lato-Bold for brand presence on key screens
   */
  h1: {
    fontFamily: FontFamily.accentBold,
    fontSize: FontSize.hero,
    lineHeight: FontSize.hero * LineHeight.tight,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: FontFamily.accentBold,
    fontSize: FontSize.display,
    lineHeight: FontSize.display * LineHeight.tight,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
    lineHeight: FontSize.xxl * LineHeight.tight,
  },
  h4: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    lineHeight: FontSize.xl * LineHeight.tight,
  },
  h5: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.lg,
    lineHeight: FontSize.lg * LineHeight.normal,
  },
  h6: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.normal,
  },

  /**
   * BODY TEXT
   */
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.normal,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.normal,
  },
  bodySm: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  bodySmMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.normal,
  },

  /**
   * LABEL / METADATA
   */
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.normal,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  captionMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  badge: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.tight,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  /**
   * BUTTON TEXT
   */
  buttonPrimary: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.tight,
    letterSpacing: 0.2,
  },
  buttonSecondary: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.tight,
  },
  buttonSm: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.tight,
  },

  /**
   * UI CHROME
   */
  tabLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    lineHeight: FontSize.lg * LineHeight.tight,
  },
  cardTitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.normal,
  },
  cardSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  inputLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  placeholder: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
  },
  link: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
  },
  overline: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
};
