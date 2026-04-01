import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
      port: 3000,
      host: 'localhost',
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
            'supabase': ['@supabase/supabase-js'],
            'react-query': ['@tanstack/react-query'],
            'recharts': ['recharts'],
            'leaflet': ['leaflet', 'react-leaflet'],
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
    }
});
