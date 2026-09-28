```tsx
import FinalStandings from '@/components/FinalStandings';

// Alone, Compass shows its rank card instead of the list.
<FinalStandings
  entries={[{ name: 'Zoé', total: 1330 }]}
  hero={{ emoji: '🧭', title: t.endScreen.ranks[2] }}
  homeLabel={t.endScreen.menu}
  onHome={onMenu}
  recap={recap}
  title={t.endScreen.title}
/>
```
