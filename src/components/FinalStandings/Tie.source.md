```tsx
import FinalStandings from '@/components/FinalStandings';
import Button from '@/components/ui/Button';

// Two players on the same top total: the banner names both.
<FinalStandings
  entries={[
    { name: 'Zoé', total: 1500 },
    { name: 'Max', total: 1500 },
    { name: 'Léa', total: 800 },
  ]}
  title={t.endScreen.title}
>
  <Button label={t.endScreen.menu} onPress={handleQuit} />
</FinalStandings>
```
