import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { source } from '@/storybook/source';

import { FooterNav } from './FooterNav';
import onDistanceCode from './OnDistance.source.md?raw';
import onHeadingCode from './OnHeading.source.md?raw';
import validateDisabledCode from './ValidateDisabled.source.md?raw';

const meta = {
  title: 'Compass/FooterNav',
  component: FooterNav,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
  args: { onGoToCap: fn(), onGoToDistance: fn(), onValidate: fn(), validateDisabled: false },
} satisfies Meta<typeof FooterNav>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Scrolled to the heading (compass) section: the button leads down to the distance. */
export const OnHeading: Story = {
  parameters: source(onHeadingCode),
  args: { onCap: true },
};

/** Scrolled to the distance section: the button leads back up to the heading. */
export const OnDistance: Story = {
  parameters: source(onDistanceCode),
  args: { onCap: false },
};

/** Nothing touched yet on this device: "Valider" stays disabled. */
export const ValidateDisabled: Story = {
  parameters: source(validateDisabledCode),
  args: { onCap: true, validateDisabled: true },
};
