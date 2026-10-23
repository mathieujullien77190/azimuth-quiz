import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

import { PAGES } from './src/pageList';
import { sharedDefine, sharedOptimizeDeps, sharedResolve } from './vite.shared';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * GitHub Pages sert des fichiers sans repli vers l'app : chaque page a donc sa propre copie de `index.html` dans
 * `dist/<page>/`.
 */
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
      // Storybook build avec cette config dans un autre dossier (parfois avant qu'il y ait un `dist`) : on n'y touche
      // pas.
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
  // Seul le build de production a besoin du sous-chemin (servi sous le site GitHub Pages du jeu, voir
  // deploy-pages.yml) ; le serveur de dev reste a la racine.
  base: command === 'build' ? '/azimuth-quiz/admin/' : '/',
  // Reutilise le `.env` racine du jeu (config Firebase, `EXPO_PUBLIC_*`).
  envDir: path.resolve(rootDir, '..'),
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
  plugins: [react(), staticPages()],
  resolve: sharedResolve,
  define: sharedDefine(command),
  optimizeDeps: sharedOptimizeDeps,
  build: {
    // Le SDK Firebase seul fait ~670 ko (minifie) : chunk vendor a part, inutile de le couper plus.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Le code tiers lourd a ses propres chunks durables, le reste se coupe par page (voir `App.tsx`).
        manualChunks(id: string) {
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase';
          // La lib 3D de la page Monde est un chunk a part : seule cette page la telecharge.
          if (id.includes('node_modules/three')) return 'three';
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
