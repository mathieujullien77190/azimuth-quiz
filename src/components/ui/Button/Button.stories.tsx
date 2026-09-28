import type { Meta, StoryObj } from '@storybook/react-vite';

import Button from './Button';
import { source } from '@/storybook/source';
import primaryCode from './Primary.source.md?raw';
import ghostCode from './Ghost.source.md?raw';
import disabledCode from './Disabled.source.md?raw';

const meta = {
  title: 'Common/ui/Button',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  parameters: source(primaryCode),
  args: { label: 'Valider', onPress: () => {} },
};

export const Ghost: Story = {
  parameters: source(ghostCode),
  args: { label: 'Suivant', onPress: () => {}, variant: 'ghost' },
};

export const Disabled: Story = {
  parameters: source(disabledCode),
  args: { label: 'Désactivé', onPress: () => {}, disabled: true },
};
