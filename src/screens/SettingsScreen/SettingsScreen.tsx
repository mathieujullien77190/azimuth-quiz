import { useState } from 'react';

import { clearAppData } from '@/helpers';
import { useLanguage } from '@/i18n';
import { useSettings } from '@/settings';
import { useThemeSettings } from '@/themes';

import { SettingsScreenView } from './SettingsScreenView';
import type { SettingsScreenProps } from './types';

export const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
  const { language, setLanguage, resetLanguage } = useLanguage();
  const { themeId, setThemeId, resetThemeId } = useThemeSettings();
  const { resetSettings } = useSettings();
  const [dataCleared, setDataCleared] = useState(false);

  // Vide le stockage ET remet les contextes en memoire par defaut, sinon l'app garde les anciennes valeurs
  // (reglages Compass, langue, theme) jusqu'au relancement.
  const onClearData = () => {
    clearAppData();
    resetSettings();
    resetLanguage();
    resetThemeId();
    setDataCleared(true);
  };

  return (
    <SettingsScreenView
      dataCleared={dataCleared}
      language={language}
      onBack={onBack}
      onClearData={onClearData}
      onSelectLanguage={setLanguage}
      onSelectTheme={setThemeId}
      themeId={themeId}
    />
  );
};
