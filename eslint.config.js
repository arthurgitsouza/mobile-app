// Lint do projeto (padrão do Expo SDK 57): https://docs.expo.dev/guides/using-eslint/
// `npm run lint` também acusa formatação fora do Prettier (regra prettier/prettier).
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  globalIgnores(['dist/*', 'web-build/*', '.expo/*']),
  expoConfig,
  prettierRecommended,
  {
    // O servidor falso roda no Node como CommonJS, não no app.
    files: ['scripts/mock-server.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    // Regras pensadas para o React Compiler, que este projeto não usa. Ficam como aviso para
    // cada dono de pasta ajustar aos poucos, sem travar o CI nem mudar comportamento agora.
    rules: {
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
