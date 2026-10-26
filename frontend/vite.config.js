import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8095',
      '/_': 'http://127.0.0.1:8095'
    }
  },
  build: {
    outDir: '../pb_public',
    // Keep previous builds' hashed files: tabs held in the background
    // (stale index.html) keep working across deploys instead of 404ing
    // into a black screen. Old files only waste disk space.
    emptyOutDir: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/embla')) return 'embla';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion';
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    }
  }
});