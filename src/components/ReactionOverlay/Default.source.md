```tsx
import ReactionOverlay from '@/components/ReactionOverlay';

// Over the whole screen (the `overlay` of a `Screen`); `reaction` is the latest one received, from `useRoomReactions`.
// Each new one (a new `seq`) is a bubble of its own that rises and goes.
<Screen overlay={<ReactionOverlay reaction={reactions.reaction} />}>{content}</Screen>
```
