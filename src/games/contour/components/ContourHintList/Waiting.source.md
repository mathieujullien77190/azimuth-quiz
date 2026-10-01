```tsx
import ContourHintList from '@/games/contour/components/ContourHintList';
import { hintGroupsView } from '@/games/contour/helpers/hintPlan';

// While another player has the turn: the list stays visible, but nothing can be tapped.
<ContourHintList disabled groups={hintGroupsView(plan, hintsRevealed)} onPick={revealHint} />
```
