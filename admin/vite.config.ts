import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  // Only the production build needs the subpath: it's served under the main app's GitHub Pages
  // site (see .github/workflows/deploy-pages.yml, which builds this into dist/admin/). The dev
  // server (`npm run admin`) stays at the root so `npm run admin` keeps working exactly as before.
  base: command === 'build' ? '/azimuth-quiz/admin/' : '/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(rootDir, '../src') },
  },
  server: {
    fs: { allow: [path.resolve(rootDir, '..')] },
  },
}));
