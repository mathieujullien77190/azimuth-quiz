import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeSettingsContext } from '@/themes';
import { source } from '@/storybook/source';

import { SplashScreen } from './SplashScreen';
import dayCode from './Day.source.md?raw';
import nightCode from './Night.source.md?raw';

const meta = {
  title: 'Common/SplashScreen',
  component: SplashScreen,
  decorators: [
    (Story) => (
      <div style={{ width: 390, height: 844, position: 'relative', overflow: 'hidden' }}>
        <View style={{ flex: 1 }}>
          <Story />
        </View>
      </div>
    ),
  ],
} satisfies Meta<typeof SplashScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

const args = {
  visible: true,
  tagline: 'Pas de GPS, que de l’instinct.',
  loadingLabel: 'Chargement…',
  version: '2.65.0',
  codename: { emoji: '🐦', name: 'great-tit', wiki: 'https://en.wikipedia.org/wiki/Great_tit' },
  fillMs: 5000,
};

/**
 * Splash de demarrage de nuit : l'aiguille oscille, la barre avance par a-coups et se bloque comme un vrai
 * chargement sur le temps minimum (5 s), le libelle « chargement » respire. Chaque story force le theme pour
 * afficher les deux cote a cote.
 */
export const Night: Story = {
  parameters: source(nightCode),
  args,
  decorators: [
    (Story) => (
      <ThemeSettingsContext.Provider
        value={{ themeId: 'night', ready: true, setThemeId: () => {}, resetThemeId: () => {} }}
      >
        <Story />
      </ThemeSettingsContext.Provider>
    ),
  ],
};

/** Le meme de jour (theme clair sauvegarde) : fond sable, cadran blanc, titre et barre bleus. */
export const Day: Story = {
  parameters: source(dayCode),
  args,
  decorators: [
    (Story) => (
      <ThemeSettingsContext.Provider
        value={{ themeId: 'day', ready: true, setThemeId: () => {}, resetThemeId: () => {} }}
      >
        <Story />
      </ThemeSettingsContext.Provider>
    ),
  ],
};
