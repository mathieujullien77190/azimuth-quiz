import type { Meta, StoryObj } from '@storybook/react-vite';

import { translations } from '@/i18n/translations';
import { source } from '@/storybook/source';

import { AppTitle } from './AppTitle';
import defaultCode from './Default.source.md?raw';

const meta = {
  title: 'Common/AppTitle',
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

/** The title block shared by the home screen and the startup splash. */
export const Default: Story = {
  parameters: source(defaultCode),
  args: { tagline: translations.fr.app.tagline },
};
