```tsx
import FinalStandings from '@/components/FinalStandings';

// Compass: who was best at what, round by round (`recap`), built from the rounds' scores.
<FinalStandings
  entries={players.map((player, index) => ({ name: player.name, total: totals[index], color: player.color }))}
  homeLabel={t.endScreen.menu}
  onHome={onMenu}
  recap={{
    title: t.endScreen.recapTitle,
    columns: [t.roundResult.direction, t.roundResult.distance],
    rows: records.map((record) => ({
      label: record.place.name,
      cells: [
        { text: 'Zoé', detail: '+400', color: '#EF4444' }, // best at the heading
        { text: 'Max', detail: '+350', color: '#3B82F6' }, // best at the distance
      ],
    })),
  }}
  title={t.endScreen.title}
/>
```
