/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config & import('@trivago/prettier-plugin-sort-imports').PrettierConfig}
 */
const config = {
  importOrder: ['<THIRD_PARTY_MODULES>', '^@/(.*)$', '^[./]'],
  importOrderSortSpecifiers: true,
  importOrderSeparation: false,
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  singleQuote: true,
  trailingComma: 'es5',
};

export default config;
