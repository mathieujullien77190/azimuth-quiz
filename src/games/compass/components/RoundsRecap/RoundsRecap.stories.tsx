import type { Meta, StoryObj } from '@storybook/react-vite';

import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';
import { source } from '@/storybook/source';

import defaultCode from './Default.source.md?raw';
import { RoundsRecap } from './RoundsRecap';

/** The recap's texts, in the toolbar's language. */
const textArgs = (t: Translations) => ({
  title: t.endScreen.recapTitle,
  columns: [t.roundResult.direction, t.roundResult.distance],
});

const meta = {
  title: 'Compass/RoundsRecap',
  component: RoundsRecap,
  args: textArgs(translations.fr),
  decorators: [
    localizedArgs(textArgs),
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoundsRecap>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Who was best at the heading and at the distance, round by round — with a tie, and a criterion
 * nobody scored on ("–"). */
export const Default: Story = {
  parameters: source(defaultCode),
  args: {
    rows: [
      {
        label: 'Paris',
        cells: [
          { text: 'Zoé', detail: '+400', color: '#EF4444' },
          { text: 'Max', detail: '+350', color: '#3B82F6' },
        ],
      },
      {
        label: 'Tokyo',
        cells: [
          { text: 'Zoé, Max', detail: '+300' },
          { text: 'Léa', detail: '+280', color: '#16A34A' },
        ],
      },
      { label: 'Nairobi', cells: [{ text: 'Max', detail: '+450', color: '#3B82F6' }, { text: '–' }] },
    ],
  },
};

/** Playing alone there is nobody to compare with: just the points won on each criterion. */
export const Solo: Story = {
  parameters: source(defaultCode),
  args: {
    rows: [
      { label: 'Paris', cells: [{ text: '+400' }, { text: '+350' }] },
      { label: 'Tokyo', cells: [{ text: '+300' }, { text: '+280' }] },
    ],
  },
};
