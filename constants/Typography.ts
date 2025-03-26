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

export const typography = {
  // Headings
  h1: {
    fontFamily: fonts.bold,
    fontSize: 32,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: 28,
  },
  h3: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  h4: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
  },
  h5: {
    fontFamily: fonts.medium,
    fontSize: 18,
  },
  
  // Body text
  bodyLarge: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  bodyLargeRegular: {
    fontFamily: fonts.regular,
    fontSize: 18,
  },
  bodyMediumBold: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  bodyMedium: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  bodyMediumRegular: {
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  bodyBold: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  bodySmallBold: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  
  // Other styles
  button: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
};