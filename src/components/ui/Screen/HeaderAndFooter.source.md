```tsx
import GameFooter from '@/components/GameFooter';
import Screen from '@/components/ui/Screen';

// `header` and `footer` sit outside the ScrollView, so they stay visible; the children scroll. The
// footer is rendered as given: wrap it in a `GameFooter` for the panel look.
<Screen
  footer={
    <GameFooter>
      <Button label={t.game.validate} onPress={submit} />
    </GameFooter>
  }
  header={<GameHeader {...headerProps} />}
>
  <PlaceCard place={place} showCountry={showCountry} />
</Screen>
```
