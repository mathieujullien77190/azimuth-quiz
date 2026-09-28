```tsx
import PlayerTabs from '@/components/PlayerTabs';

// Status only, nothing to tap. The active tab spells out whose turn it is, the others stay initials.
<PlayerTabs
  activeIndex={turnIndex}
  activeLabel={t.game.playerTurn}
  order={players.map((_, index) => index)}
  players={players}
/>
```
