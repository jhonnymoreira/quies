/** @type {import('lint-staged').Configuration} */
const config = {
  '*.{ts,js}': ['prettier --write', 'eslint --fix'],
  '*.{json,md,yaml,yml}': 'prettier --write',
};

export default config;
