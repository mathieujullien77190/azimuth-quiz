import type { Meta, StoryObj } from '@storybook/react-vite';

import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '~sb/localized';
import { source } from '~sb/source';

import { EndScreenView } from '../EndScreenView';
import defaultCode from './Default.source.md?raw';

/** Textes de l'ecran, dans la langue de la barre d'outils. */
const textArgs = (t: Translations) => ({
  title: t.endScreen.title,
  recapTitle: t.endScreen.recapTitle,
  columns: [t.roundResult.direction, t.roundResult.distance],
});

const meta = {
  title: 'Screens/EndScreenView',
  component: EndScreenView,
  args: { ...textArgs(translations.fr), onReplay: () => {}, onQuit: () => {} },
  decorators: [
    localizedArgs(textArgs),
    (Story) => (
      <div style={{ width: 390, height: 760, position: 'relative', overflow: 'auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EndScreenView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Fin de partie a deux : classement, puis le meilleur de chaque manche au cap et a la distance. */
export const Default: Story = {
  parameters: source(defaultCode),
  args: {
    localName: 'Zoé',
    maxScore: 2800,
    entries: [
      { name: 'Zoé', total: 1450, color: '#EF4444' },
      { name: 'Max', total: 1210, color: '#3B82F6' },
    ],
    rows: [
      {
        label: 'Paris',
        cells: [
          { text: 'Zoé', detail: '+400', color: '#EF4444' },
          { text: 'Max', detail: '+350', color: '#3B82F6' },
        ],
      },
      { label: 'Tokyo', cells: [{ text: 'Zoé, Max', detail: '+300' }, { text: '–' }] },
    ],
  },
};
