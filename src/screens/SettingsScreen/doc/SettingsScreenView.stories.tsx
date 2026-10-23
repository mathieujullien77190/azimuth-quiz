import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '~sb/source';

import { SettingsScreenView } from '../SettingsScreenView';
import clearedCode from './Cleared.source.md?raw';
import defaultCode from './Default.source.md?raw';

const meta = {
  title: 'Screens/SettingsScreenView',
  component: SettingsScreenView,
  args: {
    language: 'fr',
    themeId: 'night',
    dataCleared: false,
    onSelectLanguage: () => {},
    onSelectTheme: () => {},
    onClearData: () => {},
    onBack: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 390, height: 760, position: 'relative', overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SettingsScreenView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Reglages ouverts : langue, apparence, donnees et « A propos ». */
export const Default: Story = { parameters: source(defaultCode) };

/** Apres « Vider les donnees » : le bouton est grise et le confirme. */
export const Cleared: Story = {
  parameters: source(clearedCode),
  args: { dataCleared: true, language: 'en', themeId: 'day' },
};
