import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Les stories vivent a cote de leurs composants, dans le `src/` de l'app.
  stories: ['../../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  async viteFinal(viteConfig, { configType }) {
    const { mergeConfig } = await import('vite');
    const { sharedDefine, sharedOptimizeDeps, sharedResolve } = await import('../vite.shared.ts');

    return mergeConfig(viteConfig, {
      resolve: sharedResolve,
      define: sharedDefine(configType === 'PRODUCTION' ? 'build' : 'serve'),
      optimizeDeps: sharedOptimizeDeps,
    });
  },
};

export default config;
