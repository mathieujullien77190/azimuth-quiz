import type { Meta, StoryObj } from '@storybook/react-vite';

import Card from './Card';
import { source } from '@/storybook/source';
import defaultCode from './Default.source.md?raw';

const meta = {
  title: 'UI/Card',
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: source(defaultCode),
  args: {
    children: <p style={{ margin: 0 }}>Contenu de carte quelconque.</p>,
  },
};
