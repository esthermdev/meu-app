const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const simpleImportSort = require('eslint-plugin-simple-import-sort');

module.exports = defineConfig([
  globalIgnores(['dist/*', 'supabase/functions/**']),
  expoConfig,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            ['^react$', '^react-native$', '^expo', '^@?\w'],
            ['^@/'],
            ['^\.\.(?!/?$)', '^\.\./?$'],
            ['^\./(?=.*/)(?!/?$)', '^\.(?!/?$)', '^\./?$'],
            ['^.+\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
  eslintPluginPrettierRecommended,
]);
