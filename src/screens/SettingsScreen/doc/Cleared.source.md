```tsx
import { SettingsScreenView } from '@/screens/SettingsScreen/SettingsScreenView';

// `dataCleared` grise le bouton et change son libelle.
<SettingsScreenView
  dataCleared
  language="en"
  onBack={onBack}
  onClearData={onClearData}
  onSelectLanguage={setLanguage}
  onSelectTheme={setThemeId}
  themeId="day"
/>
```
