```tsx
import ClueCard from '@/games/clues/components/ClueCard';

// Multi-stage clues take a `…Stage` count: how many times the card has been picked.
<ClueCard clueId="population" label={t.cluesGame.clues.population} place={place} populationStage={2} state="revealed" />
```
