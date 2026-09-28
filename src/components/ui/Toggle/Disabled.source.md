```tsx
import Toggle from '@/components/ui/Toggle';

// Dimmed for a joiner: the switch stays tappable, `onToggleLiveCompass` decides what a press does
// (here: explain that only the host can change it).
<Toggle
  description={t.setup.toggles.liveCompass.description}
  disabled={readOnly}
  label={t.setup.toggles.liveCompass.label}
  onValueChange={onToggleLiveCompass}
  value={settings.liveCompass}
/>
```
