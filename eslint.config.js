// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
// Intenli rules: no `typography` or hex colors in module-level StyleSheet.create
const intenli = require('@intenli/ui/eslint');

module.exports = defineConfig([
  expoConfig,
  intenli,
  {
    ignores: ['dist/*'],
  },
]);
