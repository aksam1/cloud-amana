import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative asset paths, so the built app works from any folder or host (including a hosted link).
  base: './',
  plugins: [react(), tailwindcss()],
});
