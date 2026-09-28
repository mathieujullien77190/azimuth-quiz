```tsx
import NoticeOverlay from '@/components/NoticeOverlay';

// A wait rather than a dead end: `loading` turns a light spinner above the message. Nothing to
// dismiss — it goes away by itself when the screen underneath takes over.
<NoticeOverlay loading message={t.game.loading} onDismiss={() => {}} />
```
