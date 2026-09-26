import type { Meta, StoryObj } from '@storybook/react-vite';

import Card from './Card';

const meta = {
  title: 'Common/ui/Card',
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <p style={{ margin: 0 }}>Contenu de carte quelconque.</p>,
  },
};
