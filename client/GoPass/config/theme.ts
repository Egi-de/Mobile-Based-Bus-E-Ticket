import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Professional Color Palette - Inspired by Uber
const palette = {
  // Primary Blue - Deep, trustworthy navy
  primary: {
    50: '#E8EDF4',
    100: '#C5D2E3',
    200: '#9FB5D0',
    300: '#7897BD',
    400: '#5B80AF',
    500: '#0F2A44', // Main Primary Blue
    600: '#0D253D',
    700: '#0B1F34',
    800: '#08192B',
    900: '#04101C',
  },
  // Gold Accent - Vibrant, premium
  gold: {
    50: '#FEF9E7',
    100: '#FDEFC3',
    200: '#FCE59B',
    300: '#FBDB73',
    400: '#FAD355',
    500: '#F4B400', // Main Gold
    600: '#F3AD00',
    700: '#F2A400',
    800: '#F19C00',
    900: '#EF8C00',
  },
  // Emerald - Fresh, success-oriented
  emerald: {
    50: '#E7F8F0',
    100: '#C3EDD9',
    200: '#9BE2C0',
    300: '#73D6A7',
    400: '#55CD94',
    500: '#1FAA59', // Main Emerald
    600: '#1CA350',
    700: '#189946',
    800: '#148F3C',
    900: '#0D7D2B',
  },
};

const sharedColors = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  primary: palette.primary,
  gold: palette.gold,
  emerald: palette.emerald,
  success: {
    light: '#73D6A7',
    main: '#1FAA59',
    dark: '#148F3C',
  },
  warning: {
    light: '#FCE59B',
    main: '#F4B400',
    dark: '#F19C00',
  },
  error: {
    light: '#FCA5A5',
    main: '#EF4444',
    dark: '#DC2626',
  },
  info: {
    light: '#7897BD',
    main: '#0F2A44',
    dark: '#08192B',
  },
};

const typography = {
  fontFamily: {
    // Using System as fallback if Inter fonts are not loaded
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.3,
    normal: 1.5,
    relaxed: 1.7,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
};

const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  md: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  lg: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xl: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

const layout = {
  screenWidth: width,
  screenHeight: height,
  containerPadding: 16,
  maxWidth: 600,
};

const animation = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Dark Theme (Default)
export const theme = {
  colors: {
    ...sharedColors,
    accent: {
      light: '#FCE59B',
      main: '#F4B400', // Gold
      dark: '#F19C00',
    },
    background: {
      primary: '#121420', // Rich dark background
      secondary: '#1A1D2E', // Slightly lighter for cards
      tertiary: '#0A0C14', // Deepest for modals/overlays
      card: '#1A1D2E',
      cardLight: '#22253A',
      input: '#1A1D2E',
    },
    text: {
      primary: '#FFFFFF', // Pure white
      secondary: '#E5E7EB', // Light gray
      tertiary: '#9CA3AF', // Medium gray
      disabled: '#6B7280', // Darker gray
      inverse: '#1C2333', // Dark text for light backgrounds
    },
    border: {
      light: 'rgba(255, 255, 255, 0.08)',
      main: 'rgba(255, 255, 255, 0.12)',
      dark: 'rgba(255, 255, 255, 0.16)',
    },
  },
  typography: {
    ...typography,
  },
  spacing,
  borderRadius,
  shadows,
  layout,
  animation,
} as const;

// Light Theme
export const lightTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    primary: {
      ...sharedColors.primary,
    },
    accent: {
      light: '#7897BD',
      main: '#0F2A44', // Primary Blue for light mode
      dark: '#08192B',
    },
    background: {
      primary: '#F6F8FB', // Soft light background
      secondary: '#E8EDF5', // Slightly darker
      tertiary: '#FFFFFF', // Pure white for cards
      card: '#FFFFFF',
      cardLight: '#F6F8FB',
      input: '#F6F8FB',
    },
    text: {
      primary: '#1C2333', // Dark text
      secondary: '#4B5563', // Medium dark
      tertiary: '#6B7280', // Gray
      disabled: '#9CA3AF', // Light gray
      inverse: '#FFFFFF', // White text for dark backgrounds
    },
    border: {
      light: '#E5E7EB',
      main: '#D1D5DB',
      dark: '#9CA3AF',
    },
  },
  shadows: {
    none: shadows.none,
    sm: shadows.none,
    md: shadows.none,
    lg: shadows.none,
    xl: shadows.none,
  },
} as const;

export type Theme = typeof theme;
