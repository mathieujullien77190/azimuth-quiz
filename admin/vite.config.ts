import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

import { PAGES } from './src/pageList';
import { sharedDefine, sharedOptimizeDeps, sharedResolve } from './vite.shared';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** GitHub Pages serves files, with no fallback to the app: every page gets its own copy of `index.html` in
 * `dist/<page>/` (`/admin/places` → `dist/places/index.html`), asset URLs being absolute they work from there. */
const staticPages = (): Plugin => {
  let outDir = '';
  return {
    name: 'static-pages',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const dist = path.resolve(rootDir, 'dist');
      // Storybook builds with this same config into another folder (and may run before there is a `dist`): leave it alone.
      if (outDir !== dist) return;
      const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
      for (const { path: page, label } of PAGES) {
        mkdirSync(path.join(dist, page), { recursive: true });
        writeFileSync(
          path.join(dist, page, 'index.html'),
          html.replace(/<title>[^<]*<\/title>/, `<title>Azimuth Quiz — Admin · ${label}</title>`),
        );
      }
    },
  };
};

export default defineConfig(({ command }) => ({
  // Only the production build needs the subpath: it's served under the main app's GitHub Pages
  // site (see .github/workflows/deploy-pages.yml, which builds this into dist/admin/). The dev
  // server (`npm run admin`) stays at the root so `npm run admin` keeps working exactly as before.
  base: command === 'build' ? '/azimuth-quiz/admin/' : '/',
  // Reuses the game's root `.env` (Firebase config, `EXPO_PUBLIC_*`) instead of duplicating it.
  envDir: path.resolve(rootDir, '..'),
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
  plugins: [react(), staticPages()],
  resolve: sharedResolve,
  define: sharedDefine(command),
  optimizeDeps: sharedOptimizeDeps,
  build: {
    // The Firebase SDK alone is ~670 kB (minified): it is a vendor chunk of its own, not something to split further.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Heavy third-party code gets its own long-lived chunks, the rest is split by page (see `App.tsx`).
        manualChunks(id: string) {
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase';
          if (id.includes('react-native-web') || id.includes('react-native-svg')) return 'react-native-web';
          return undefined;
        },
      },
    },
  },
  server: {
    fs: { allow: [path.resolve(rootDir, '..')] },
  },
}));
