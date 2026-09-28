```tsx
import NoticeOverlay from '@/components/NoticeOverlay';

// Rendered on top of the current screen; `message` null hides it. Tapping anywhere calls
// `onDismiss`, well before the caller's own auto-dismiss timeout.
<NoticeOverlay message={overlayMessage} onDismiss={dismissOverlay} />
```
