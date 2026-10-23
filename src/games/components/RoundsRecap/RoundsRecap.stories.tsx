import type { Meta, StoryObj } from '@storybook/react-vite';

import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';
import { source } from '@/storybook/source';

import defaultCode from './Default.source.md?raw';
import { RoundsRecap } from './RoundsRecap';

/** Textes du recap, dans la langue de la barre d'outils. */
const textArgs = (t: Translations) => ({
  title: t.endScreen.recapTitle,
  columns: [t.roundResult.direction, t.roundResult.distance],
});

const meta = {
  title: 'Common/RoundsRecap',
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

/** Meilleur au cap et a la distance par manche, avec egalite et critere sans score ("-"). */
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

/** Seul, rien a comparer : seulement les points gagnes par critere. */
export const Solo: Story = {
  parameters: source(defaultCode),
  args: {
    rows: [
      { label: 'Paris', cells: [{ text: '+400' }, { text: '+350' }] },
      { label: 'Tokyo', cells: [{ text: '+300' }, { text: '+280' }] },
    ],
  },
};
