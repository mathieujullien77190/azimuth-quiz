import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './Button';
import { source } from '~sb/source';
import primaryCode from './doc/Primary.source.md?raw';
import ghostCode from './doc/Ghost.source.md?raw';
import disabledCode from './doc/Disabled.source.md?raw';

const meta = {
  title: 'UI/Button',
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
