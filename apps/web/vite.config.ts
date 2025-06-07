import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import path from 'path';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/web',

  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  preview: {
    port: 4173,
    host: true,
  },

  plugins: [
    react(),
    nxViteTsPaths(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../libs/shared/src'),
    },
  },

  build: {
    outDir: '../../dist/apps/web',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
