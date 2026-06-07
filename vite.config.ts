import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-mathfocus-[hash].js',
        chunkFileNames: 'assets/[name]-mathfocus-[hash].js',
        assetFileNames: 'assets/[name]-mathfocus-[hash][extname]',
      },
    },
  },
});
