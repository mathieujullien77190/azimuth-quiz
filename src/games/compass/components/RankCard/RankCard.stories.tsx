import type { Meta, StoryObj } from '@storybook/react-vite';

import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';
import { source } from '@/storybook/source';

import defaultCode from './Default.source.md?raw';
import { RankCard } from './RankCard';

/** The rank title, in the toolbar's language (third of the five ranks). */
const textArgs = (t: Translations) => ({ title: t.endScreen.ranks[2] });

const meta = {
  title: 'Compass/RankCard',
  component: RankCard,
  args: { emoji: '🧭', score: 1330, ...textArgs(translations.fr) },
  decorators: [
    localizedArgs(textArgs),
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RankCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Playing alone: the rank earned for the total score. */
export const Default: Story = {
  parameters: source(defaultCode),
};
