```tsx
import ReactionBar from '@/components/ReactionBar';
import { REACTION_EMOJIS } from '@/data';

// One round button floating just above the footer it is a child of, at the bottom-right corner; its column of emojis
// pops open upward from it. It takes no room in the footer.
<ReactionBar
  emojis={REACTION_EMOJIS}
  labelFor={t.reactions.send}
  onPick={sendReaction}
  toggleLabel={t.reactions.toggle}
/>
```
