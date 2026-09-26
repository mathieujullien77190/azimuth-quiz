import type { Meta, StoryObj } from '@storybook/react-vite';

import { UfoButton } from './UfoButton';

const meta = {
  title: 'Common/UfoButton',
  component: UfoButton,
} satisfies Meta<typeof UfoButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { accessibilityLabel: 'Réglages', onPress: () => {} },
};
