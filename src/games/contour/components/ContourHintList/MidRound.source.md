```tsx
import ContourHintList from '@/games/contour/components/ContourHintList';
import { hintGroupsView } from '@/games/contour/helpers/hintPlan';

// Under the country: the hints in groups (outline, neighbors, cities). Tapping the next step of a group reveals it
// and passes the turn; `plan` is the round's steps in the order the players picked them.
<ContourHintList groups={hintGroupsView(plan, hintsRevealed)} onPick={revealHint} />
```
