import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

import { sharedDefine, sharedResolve } from './vite.shared';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Tests unitaires de l'admin (ceux du jeu tournent avec Jest a la racine, qui ignore `admin/`). Vitest reprend la
// recette Vite de l'admin (`import.meta.env`, alias `@/` vers `../src`, react-native-web) : le code est teste tel que
// build. Couverture a 100 % : `npm run test:coverage`.
export default defineConfig({
  envDir: path.resolve(rootDir, '..'),
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
  plugins: [react()],
  resolve: sharedResolve,
  define: sharedDefine('serve'),
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    clearMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/types.ts', 'src/**/index.ts', 'src/vite-env.d.ts', 'src/main.tsx'],
      reporter: ['text-summary', 'json-summary', 'json'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
