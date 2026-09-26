import type { Meta, StoryObj } from '@storybook/react-vite';

import Toggle from './Toggle';

const meta = {
  title: 'Common/ui/Toggle',
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
  args: {
    label: 'Une option',
    description: 'Une description optionnelle.',
    value: true,
    onValueChange: () => {},
  },
};
