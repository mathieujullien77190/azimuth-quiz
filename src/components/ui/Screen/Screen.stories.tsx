import type { Meta, StoryObj } from '@storybook/react-vite';

import GameFooter from '../../game/GameFooter';
import Button from '../Button';
import Card from '../Card';

import { Screen } from './Screen';
import { source } from '~sb/source';
import headerAndFooterCode from './HeaderAndFooter.source.md?raw';

const meta = {
  title: 'UI/Screen',
  component: Screen,
  // `Screen` reserve toute sa hauteur via flex:1 (SafeAreaView -> ScrollView) : il lui faut un parent flex colonne
  // a hauteur fixe, sinon il s'effondre a 0 dans une boite bloc.
  decorators: [
    (Story) => (
      <div style={{ height: 420, display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Screen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const HeaderAndFooter: Story = {
  parameters: source(headerAndFooterCode),
  args: {
    header: <Card>En-tête fixe</Card>,
    footer: (
      <GameFooter>
        <Button label="Valider" onPress={() => {}} />
      </GameFooter>
    ),
    children: (
      <Card>
        <p style={{ margin: 0 }}>Contenu défilant.</p>
      </Card>
    ),
  },
};
