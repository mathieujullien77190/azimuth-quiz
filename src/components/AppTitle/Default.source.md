```tsx
import AppTitle from '@/components/AppTitle';

// Drawn by the home screen AND by the startup splash, first thing inside a `Screen`-like safe area: the title does not
// move when the splash fades into the home.
<AppTitle tagline={t.app.tagline} />
```
