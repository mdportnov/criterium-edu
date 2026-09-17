import { defineConfig } from 'vitest/config';
import * as path from 'path';

const sharedSrc = path.resolve(__dirname, '../../libs/shared/src');

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vitest/apps/api',
  resolve: {
    // Mirrors the tsconfig paths: the bare specifier and the subpaths
    // (@app/shared/dto, @app/shared/interfaces) both have to resolve.
    alias: [
      { find: /^@app\/shared$/, replacement: path.join(sharedSrc, 'index.ts') },
      { find: /^@app\/shared\//, replacement: `${sharedSrc}/` },
    ],
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
