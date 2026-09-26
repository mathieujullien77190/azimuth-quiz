import type { Meta, StoryObj } from '@storybook/react-vite';

import Button from '../Button';
import Card from '../Card';

import Screen from './Screen';

const meta = {
  title: 'Common/ui/Screen',
  component: Screen,
  // `Screen` reserves its own full height via flex:1 (SafeAreaView -> ScrollView): it needs a real
  // flex-column ancestor with a fixed height, or it collapses to 0 in a plain block box.
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
  args: {
    header: <Card>En-tête fixe</Card>,
    footer: <Button label="Valider" onPress={() => {}} />,
    children: (
      <Card>
        <p style={{ margin: 0 }}>Contenu défilant.</p>
      </Card>
    ),
  },
};
