import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/app.ts', 'src/server.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
  target: 'node18',
});
