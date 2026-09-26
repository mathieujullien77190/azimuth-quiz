import type { Meta, StoryObj } from '@storybook/react-vite';

import Button from './Button';

const meta = {
  title: 'Common/ui/Button',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { label: 'Valider', onPress: () => {} },
};

export const Ghost: Story = {
  args: { label: 'Suivant', onPress: () => {}, variant: 'ghost' },
};

export const Disabled: Story = {
  args: { label: 'Désactivé', onPress: () => {}, disabled: true },
};
