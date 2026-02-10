import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'gsap': ['gsap'],
              'lenis': ['lenis'],
              'vendor': ['react', 'react-dom', 'react-router-dom'],
            }
          }
        },
        chunkSizeWarningLimit: 1000,
        minify: 'esbuild', // Use esbuild for faster builds
      }
    };
});
