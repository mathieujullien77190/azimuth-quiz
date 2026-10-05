import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '@/storybook/source';

import defaultCode from './Default.source.md?raw';
import { VersionLine } from './VersionLine';

const meta = {
  title: 'Common/VersionLine',
  component: VersionLine,
} satisfies Meta<typeof VersionLine>;

export default meta;

type Story = StoryObj<typeof meta>;

/** "v2.65.0 - 🐦 - great-tit", the name linking to its English Wikipedia article. */
export const Default: Story = {
  parameters: source(defaultCode),
  args: {
    version: '2.65.0',
    codename: { emoji: '🐦', name: 'great-tit', wiki: 'https://en.wikipedia.org/wiki/Great_tit' },
  },
};
