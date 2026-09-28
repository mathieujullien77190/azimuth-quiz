```tsx
import GameFooter from '@/components/GameFooter';
import Screen from '@/components/ui/Screen';

// The panel around whatever the game puts at the bottom. As the `footer` of a `Screen`:
<Screen
  footer={
    <GameFooter>
      <Button label={t.game.next} onPress={goToNextRound} />
    </GameFooter>
  }
  header={<GameHeader {...headerProps} />}
>
  {content}
</Screen>
```
