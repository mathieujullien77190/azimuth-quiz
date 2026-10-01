import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

import { sharedDefine, sharedResolve } from './vite.shared';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// The admin's unit tests (the game's own tests run with Jest from the repo root, which ignores `admin/`). Vitest reads
// the Vite recipe of the admin (`import.meta.env`, the `@/` alias to `../src`, react-native-web), so the code is tested
// as it is built. Coverage must stay at 100 %: `npm run test:coverage`.
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
