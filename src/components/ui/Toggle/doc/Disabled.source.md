```tsx
import Toggle from '@/components/ui/Toggle';

// Dimmed for a joiner: the switch stays tappable, `onToggleShowCountry` decides what a press does
// (here: explain that only the host can change it).
<Toggle
  description={t.setup.toggles.showCountry.description}
  disabled={readOnly}
  label={t.setup.toggles.showCountry.label}
  onValueChange={onToggleShowCountry}
  value={settings.showCountry}
/>
```
