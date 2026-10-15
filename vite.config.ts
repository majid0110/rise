import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project site: https://<user>.github.io/rise/
export default defineConfig({
  base: '/rise/',
  plugins: [react()],
  build: { sourcemap: false },
});
