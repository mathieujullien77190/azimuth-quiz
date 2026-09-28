```tsx
import ColorPalette from '@/components/ColorPalette';
import { THEMES, ThemeSettingsContext } from '@/themes';

// Night alone, rendered in Night whatever theme the app is showing: pin it with a ThemeSettingsContext.
<ThemeSettingsContext.Provider value={{ ...settings, themeId: 'night' }}>
  <ColorPalette themes={[THEMES.night]} />
</ThemeSettingsContext.Provider>
```
