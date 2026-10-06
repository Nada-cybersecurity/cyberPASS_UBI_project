import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` -> normal static build (dist/), deploy to GitHub Pages, Vercel, Netlify or the Docker image.
// `npm run build:single` -> one self-contained HTML file (dist-single/index.html) for hosting anywhere.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    chunkSizeWarningLimit: 4000,
    target: 'es2022',
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
}));
