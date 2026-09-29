```tsx
import ClueCard from '@/games/clues/components/ClueCard';

// `charadeStage` counts syllable-groups revealed (see `charadeSyllableGroups`), one per click;
// the click past the last group spells the name out in clear, as a filet de sécurité.
<ClueCard charadeStage={2} clueId="charade" label={t.cluesGame.clues.charade} place={place} state="revealed" />
```
