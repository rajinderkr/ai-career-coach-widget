import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Use static, non-hashed filenames for easy integration into external sites like an MVC project.
        entryFileNames: `assets/career-coach.js`,
        assetFileNames: `assets/career-coach.css`,
      },
    },
    // Disable sourcemaps for a cleaner production build.
    sourcemap: false,
  },
});