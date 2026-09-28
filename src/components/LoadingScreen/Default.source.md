```tsx
import LoadingScreen from '@/components/LoadingScreen';

// Early return while the room's first snapshot isn't there yet.
if (localUid === null || roomSettings === null || place === undefined) return <LoadingScreen />;
```
