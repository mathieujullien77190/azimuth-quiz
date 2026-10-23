import type { Meta, StoryObj } from '@storybook/react-vite';

import { translations } from '@/i18n/translations';
import { source } from '~sb/source';

import { AppTitle } from '../AppTitle';
import defaultCode from './Default.source.md?raw';

const meta = {
  title: 'Home/AppTitle',
  component: AppTitle,
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AppTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Bloc titre partage par l'accueil et l'ecran de demarrage. */
export const Default: Story = {
  parameters: source(defaultCode),
  args: { tagline: translations.fr.app.tagline },
};
