import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '@/storybook/source';
import defaultCode from './Default.source.md?raw';

import { TypedAnswer } from './TypedAnswer';
import { typedSkeleton } from './helpers';

const meta = {
  title: 'Common/TypedAnswer',
  component: TypedAnswer,
  args: { groups: typedSkeleton('Costa Rica') },
} satisfies Meta<typeof TypedAnswer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { parameters: source(defaultCode) };

export const WithEmptySlots: Story = { args: { groups: [['C', 'O', null, null], ['R', null]] } };

export const Hyphen: Story = { args: { groups: typedSkeleton('Guinée-Bissau') } };
