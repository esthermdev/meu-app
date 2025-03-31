// constants/Typography.ts
export const fonts = {
  thin: 'GeistThin',
  extraLight: 'GeistExtraLight', 
  light: 'GeistLight',
  regular: 'GeistRegular',
  medium: 'GeistMedium',
  semiBold: 'GeistSemiBold',
  bold: 'GeistBold',
  extraBold: 'GeistExtraBold',
  black: 'GeistBlack',
};

// Fixed font sizes that won't scale with device settings
export const fontSizes = {
  xxs: 10,    // Extra extra small
  xs: 12,     // Extra small
  sm: 14,     // Small
  md: 16,     // Medium
  lg: 18,     // Large
  xl: 20,     // Extra large
  xxl: 24,    // Extra extra large
  xxxl: 28,   // Extra extra extra large
  display: 32 // Display size
};

export const typography = {
  // Headings - clear hierarchy with consistent naming
  heading1: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.display,
  },
  heading2: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxxl,
  },
  heading3: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
  },
  heading4: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xl,
  },
  heading5: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
  },
  
  // Body text - comprehensive options with weight and size variants
  textLarge: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
  },
  textLargeMedium: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
  },
  textLargeSemiBold: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
  },
  textLargeBold: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
  },
  
  text: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
  },
  textMedium: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
  },
  textSemiBold: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
  },
  textBold: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
  },
  
  textSmall: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
  },
  textSmallMedium: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
  },
  textSmallBold: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
  },
  
  textXSmall: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
  },
  textXSmallMedium: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
  },
  textXSmallBold: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
  },
  
  // UI specific text styles
  button: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
  },
  buttonSmall: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
  },
  buttonLarge: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
  },
  
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
  },
  labelBold: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
  },
  
  caption: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
  },
  
  // For backward compatibility - keep your original styles
  // These map to your original typography keys
  h1: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.display,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxxl,
  },
  h3: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
  },
  h4: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xl,
  },
  h5: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
  },
  
  bodyLarge: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
  },
  bodyLargeRegular: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
  },
  bodyMediumBold: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
  },
  bodyMedium: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
  },
  bodyMediumRegular: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
  },
  bodyBold: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
  },
  bodySmallBold: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
  },
};