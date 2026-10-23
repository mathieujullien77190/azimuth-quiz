```tsx
import { SettingsScreenView } from '@/screens/SettingsScreen/SettingsScreenView';

// Le container lit les stores (langue, theme, reglages) ; la vue ne recoit que l'etat courant et des callbacks.
<SettingsScreenView
  dataCleared={dataCleared}
  language={language}
  onBack={onBack}
  onClearData={onClearData}
  onSelectLanguage={setLanguage}
  onSelectTheme={setThemeId}
  themeId={themeId}
/>
```
