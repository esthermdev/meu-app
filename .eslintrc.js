// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ['expo', 'prettier'],
  ignorePatterns: ['/dist/*', 'supabase/functions/**'],
  plugins: ['prettier', 'react-native'],
  rules: {
    'prettier/prettier': 'warn',
    'react-native/sort-styles': [
      'warn',
      'asc',
      {
        ignoreClassNames: true,
        ignoreStyleProperties: false,
      },
    ],
  },
};
