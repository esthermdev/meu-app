// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ['expo', 'prettier'],
  ignorePatterns: ['/dist/*', 'supabase/functions/**'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'warn',
  },
};
