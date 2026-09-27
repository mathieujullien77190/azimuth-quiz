import type { Meta, StoryObj } from '@storybook/react-vite';

import { HelicopterButton } from './HelicopterButton';

const meta = {
  title: 'Common/HelicopterButton',
  component: HelicopterButton,
} satisfies Meta<typeof HelicopterButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { accessibilityLabel: 'Réglages', onPress: () => {} },
};
