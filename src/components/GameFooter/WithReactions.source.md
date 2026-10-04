```tsx
import GameFooter from '@/components/GameFooter';

// `onReact` comes from `useRoomReactions` (through the game's hook): left out alone in the room, no round button then; it floats above the footer, taking no room in it.
<GameFooter onReact={reactions.canReact ? reactions.send : undefined}>
  <Button label={t.game.next} onPress={goToNextRound} />
</GameFooter>
```
