// ============================================
// MOMENTUM DESIGN SYSTEM
// Colors, typography, and spacing for ADHD-friendly UI
// ============================================

export const Colors = {
  // Primary palette - energizing but not overwhelming
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Main primary
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },

  // Background - dark mode first (easier on ADHD eyes at night)
  background: {
    primary: '#0f0f1a',
    secondary: '#1a1a2e',
    tertiary: '#25253a',
    elevated: '#2d2d44',
  },

  // Surface colors
  surface: {
    default: '#1a1a2e',
    hover: '#25253a',
    active: '#2d2d44',
    disabled: '#16162a',
  },

  // Text
  text: {
    primary: '#ffffff',
    secondary: '#a0a0b0',
    tertiary: '#6b6b7a',
    inverse: '#0f0f1a',
  },

  // Status colors
  success: {
    default: '#22c55e',
    light: '#4ade80',
    dark: '#16a34a',
  },
  warning: {
    default: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
  error: {
    default: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
  },
  info: {
    default: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
  },

  // Gamification colors
  xp: '#fbbf24',
  streak: '#f97316',
  level: '#8b5cf6',
  achievement: {
    common: '#94a3b8',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#f59e0b',
  },

  // Priority colors
  priority: {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#fbbf24',
    low: '#22c55e',
    someday: '#6b7280',
  },

  // Energy level colors
  energy: {
    1: '#ef4444', // Very low
    2: '#f97316', // Low
    3: '#fbbf24', // Medium
    4: '#84cc16', // High
    5: '#22c55e', // Very high
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Typography = {
  // Display - for big numbers and celebrations
  display: {
    fontSize: 48,
    fontWeight: '700' as const,
    lineHeight: 56,
  },

  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },

  // Body text
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },

  // Labels and captions
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },

  // Numbers (for XP, streaks, etc.)
  number: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 0,
  }),
};

// Animation durations - snappy for ADHD
export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
};

// Haptic feedback types
export const Haptics = {
  light: 'light' as const,
  medium: 'medium' as const,
  heavy: 'heavy' as const,
  success: 'success' as const,
  warning: 'warning' as const,
  error: 'error' as const,
};
