```tsx
import SplashScreen from '@/components/SplashScreen';

// Same component: it follows the saved theme through the theme tokens, so a player on the light theme gets the sand
// background, the white dial and the blue title with no prop to change.
<SplashScreen
  fillMs={5000}
  tagline={t.app.tagline}
  loadingLabel={t.splash.loading}
  codename={{ emoji: '🐦', name: 'great-tit', wiki: 'https://en.wikipedia.org/wiki/Great_tit' }}
  version="2.65.0"
  visible={visible}
/>
```
