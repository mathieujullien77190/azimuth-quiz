import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Stories are colocated with each component under the app's own `src/` (see
  // `react-structure`'s convention: `src/components/<Name>/<Name>.stories.tsx`), not under
  // `admin/` — Storybook here only supplies the Vite builder and the react-native-web
  // resolution recipe (`viteFinal` below, shared with `../vite.config.ts` via `vite.shared.ts`).
  stories: ['../../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import('vite');
    const { sharedDefine, sharedOptimizeDeps, sharedResolve } = await import('../vite.shared.ts');

    return mergeConfig(viteConfig, {
      resolve: sharedResolve,
      define: sharedDefine('serve'),
      optimizeDeps: sharedOptimizeDeps,
    });
  },
};

export default config;
