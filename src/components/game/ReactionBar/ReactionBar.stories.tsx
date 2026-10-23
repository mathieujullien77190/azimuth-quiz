import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { REACTION_EMOJIS } from '@/data';
import { source } from '~sb/source';

import { ReactionBar } from './ReactionBar';
import defaultCode from './Default.source.md?raw';

const meta = {
  title: 'Game/ReactionBar',
  component: ReactionBar,
  decorators: [
    (Story) => (
      <div style={{ width: 360, height: 420, position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReactionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Petit bouton rond flottant en bas a droite, juste au-dessus du footer dont il est l'enfant ; un tap ouvre
 * vers le haut une colonne d'emojis (cibles de 44 px). Un emoji appelle `onPick` et laisse la colonne ouverte,
 * seul le bouton rond la ferme.
 */
export const Default: Story = {
  parameters: source(defaultCode),
  args: { emojis: REACTION_EMOJIS, labelFor: (emoji: string) => `Envoyer ${emoji}`, onPick: fn(), toggleLabel: 'Réactions' },
};
