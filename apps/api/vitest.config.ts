import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vitest/apps/api',
  resolve: {
    alias: {
      '@app/shared': path.resolve(__dirname, '../../libs/shared/src/index.ts'),
      '@shared': path.resolve(__dirname, '../../libs/shared/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reportsDirectory: '../../coverage/apps/api',
      reporter: ['text', 'lcov'],
    },
  },
});
