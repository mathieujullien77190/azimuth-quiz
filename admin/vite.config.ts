import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { sharedDefine, sharedOptimizeDeps, sharedResolve } from './vite.shared';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  // Only the production build needs the subpath: it's served under the main app's GitHub Pages
  // site (see .github/workflows/deploy-pages.yml, which builds this into dist/admin/). The dev
  // server (`npm run admin`) stays at the root so `npm run admin` keeps working exactly as before.
  base: command === 'build' ? '/azimuth-quiz/admin/' : '/',
  plugins: [react()],
  resolve: sharedResolve,
  define: sharedDefine(command),
  optimizeDeps: sharedOptimizeDeps,
  server: {
    fs: { allow: [path.resolve(rootDir, '..')] },
  },
}));
