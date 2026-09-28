```tsx
import FinalStandings from '@/components/FinalStandings';
import Button from '@/components/ui/Button';

// Everything under the scores is the game's own: here just the button that leaves the game.
<FinalStandings entries={entries} title={t.endScreen.title}>
  <Button label={t.endScreen.menu} onPress={handleQuit} />
</FinalStandings>
```
