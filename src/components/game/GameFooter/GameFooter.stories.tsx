import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Button from '@/components/ui/Button';
import { source } from '@/storybook/source';

import { GameFooter } from './GameFooter';
import withButtonCode from './WithButton.source.md?raw';
import withReactionsCode from './WithReactions.source.md?raw';

const meta = {
  title: 'Game/GameFooter',
  component: GameFooter,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GameFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Le panneau dans lequel se pose le footer de chaque jeu (surface translucide, bord haut) ;
 * le contenu depend du jeu : ici le bouton "manche suivante" de l'hote. */
export const WithButton: Story = {
  parameters: source(withButtonCode),
  args: { children: <Button label="Manche suivante" onPress={fn()} /> },
};

/** Dans une room a plusieurs, un petit bouton rond flotte juste au-dessus du footer, a son coin droit (hors de son
 * flux). Il ouvre une colonne d'emojis contre le bord droit ; un tap en envoie un a tous (voir `useRoomReactions`).
 * Seul dans la room, `onReact` est omis et le bouton aussi. */
export const WithReactions: Story = {
  parameters: source(withReactionsCode),
  args: { children: <Button label="Manche suivante" onPress={fn()} />, onReact: fn() },
};
