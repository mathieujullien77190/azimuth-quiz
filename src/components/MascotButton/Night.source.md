```tsx
import MascotButton from '@/components/MascotButton';

// Opens the settings screen. The saucer/helicopter follows the current theme — nothing to pass.
<MascotButton accessibilityLabel={t.home.settingsButtonLabel} onPress={() => router.push('/settings')} />
```
