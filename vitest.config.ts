import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('./src/', import.meta.url).pathname,
    },
  },
  test: {
    coverage: {
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/app/app.ts',
        'src/app/app-env.ts',
        'src/app/logger.ts',
        'src/app/get-environment-variables.ts',
        'src/database/database.ts',
        'src/database/__mocks__/**',
        'src/database/result-types.ts',
        'src/database/schema.ts',
      ],
    },
    globals: true,
    isolate: false,
    reporters: ['verbose'],
    watch: false,
  },
});
