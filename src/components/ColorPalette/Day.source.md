```tsx
import ColorPalette from '@/components/ColorPalette';
import { THEMES, ThemeSettingsContext } from '@/themes';

// Day alone, rendered in Day whatever theme the app is showing: pin it with a ThemeSettingsContext.
<ThemeSettingsContext.Provider value={{ ...settings, themeId: 'day' }}>
  <ColorPalette themes={[THEMES.day]} />
</ThemeSettingsContext.Provider>
```
