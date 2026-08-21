import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    entries: ['index.html']
  },
  server: {
    port: 3000,
    open: false
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: 'index.html'
    }
  }
});
