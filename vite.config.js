import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          potree: ['potree-core'],
          tween: ['@tweenjs/tween.js']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
