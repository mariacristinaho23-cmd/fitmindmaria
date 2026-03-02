export const theme = {
  colors: {
    background: '#FFFFFF', // Pure White to match logo background
    primary: '#E12A1B', // Fire Red
    secondary: '#FF8800', // Fire Orange
    accent: '#FFD700', // Fire Yellow
    text: '#000000', // Strong Black for text like the FitMind font
    textLight: '#666666', // Dark gray
    surface: '#F8F9FA', // Very light grey for cards
    error: '#D32F2F',
    success: '#388E3C',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' },
    h2: { fontSize: 24, fontWeight: '600' },
    h3: { fontSize: 20, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 12, fontWeight: '400' },
  }
} as const;
