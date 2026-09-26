import type { Meta, StoryObj } from '@storybook/react-vite';

import Section from './Section';

const meta = {
  title: 'Common/ui/Section',
  component: Section,
} satisfies Meta<typeof Section>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Un titre de section',
    hint: 'Un indice optionnel.',
    children: <p style={{ margin: 0 }}>Enfant quelconque.</p>,
  },
};
