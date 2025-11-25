import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/api/cameras': {
        target: 'https://webcams.nyctmc.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/cameras/, '/api/cameras'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NYC-GIF-Creator)'
        }
      }
    }
  }
});
