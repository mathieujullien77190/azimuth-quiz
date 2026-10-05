```tsx
import SplashScreen from '@/components/SplashScreen';

// Mounted once by `StartupSplash` (root layout), which says when it is wanted: `visible` turns false once the app is
// ready and the minimum time (5 s) has passed, and the splash fades out and removes itself. The loading bar jumps and
// stalls like a real loader (`buildProgressSteps`), ends on the minimum time under 100 % and completes on release.
<SplashScreen
  fillMs={5000}
  tagline={t.app.tagline}
  loadingLabel={t.splash.loading}
  versionLabel="v2.64.1 - 🦥 - brown-throated-sloth"
  visible={visible}
/>
```
