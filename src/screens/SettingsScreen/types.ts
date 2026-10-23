import type { Language } from '@/i18n';
import type { ThemeId } from '@/types';

export type SettingsScreenProps = {
  onBack: () => void;
};

export type SettingsScreenViewProps = {
  language: Language;
  themeId: ThemeId;
  /** Les donnees viennent d'etre effacees : le bouton est grise et le dit. */
  dataCleared: boolean;
  onSelectLanguage: (language: Language) => void;
  onSelectTheme: (themeId: ThemeId) => void;
  onClearData: () => void;
  onBack: () => void;
};
