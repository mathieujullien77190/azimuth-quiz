import type { Meta, StoryObj } from '@storybook/react-vite';

import { Toggle } from './Toggle';
import { source } from '@/storybook/source';
import defaultCode from './Default.source.md?raw';

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: source(defaultCode),
  args: {
    label: 'Une option',
    description: 'Une description optionnelle.',
    value: true,
    onValueChange: () => {},
  },
};
