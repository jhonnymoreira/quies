import { build } from 'esbuild';

await build({
  alias: {
    '@': './src',
  },
  bundle: true,
  entryPoints: ['src/index.ts'],
  format: 'esm',
  minify: true,
  outdir: 'dist',
  packages: 'external',
  platform: 'node',
  sourcemap: true,
  target: 'node24',
});
