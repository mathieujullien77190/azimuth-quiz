import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { source } from '~sb/source';

import { FooterNav } from '../FooterNav';
import onDistanceCode from './OnDistance.source.md?raw';
import onHeadingCode from './OnHeading.source.md?raw';
import validateDisabledCode from './ValidateDisabled.source.md?raw';

const meta = {
  title: 'Game/FooterNav',
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

/** Section cap : le bouton mene a la distance. */
export const OnHeading: Story = {
  parameters: source(onHeadingCode),
  args: { onCap: true },
};

/** Section distance : le bouton ramene au cap. */
export const OnDistance: Story = {
  parameters: source(onDistanceCode),
  args: { onCap: false },
};

/** Rien touche sur cet appareil : "Valider" reste desactive. */
export const ValidateDisabled: Story = {
  parameters: source(validateDisabledCode),
  args: { onCap: true, validateDisabled: true },
};
