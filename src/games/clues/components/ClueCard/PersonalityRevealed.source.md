```tsx
import ClueCard from '@/games/clues/components/ClueCard';

// Single stage, like isCapital/position: reads `personalityFor(place)` itself, nothing to pass in.
<ClueCard clueId="personality" label={t.cluesGame.clues.personality} place={place} state="revealed" />
```
