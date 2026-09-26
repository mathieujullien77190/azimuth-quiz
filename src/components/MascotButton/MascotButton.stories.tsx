import type { Meta, StoryObj } from '@storybook/react-vite';

import { MascotButton } from './MascotButton';

const meta = {
  title: 'Common/MascotButton',
  component: MascotButton,
} satisfies Meta<typeof MascotButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Follows `theme.isDark` directly: flying saucer at night, helicopter by day. Renders whichever
 * matches the default theme (night) — see `HelicopterButton`/`UfoButton` for each drawing on its
 * own regardless of theme. */
export const Default: Story = {
  args: { accessibilityLabel: 'Réglages', onPress: () => {} },
};
