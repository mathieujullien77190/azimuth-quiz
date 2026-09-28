```tsx
import RoundsRecap from '@/games/compass/components/RoundsRecap';

// Compass' end screen, as `children` of the shared `FinalStandings`: the winners are worked out by the
// caller (`roundBest` in `EndScreen/helpers.ts`), the recap only lays them out.
<RoundsRecap
  columns={[t.roundResult.direction, t.roundResult.distance]}
  rows={records.map((record) => ({
    label: record.place.name,
    cells: [
      { text: 'Zoé', detail: '+400', color: '#EF4444' }, // best at the heading
      { text: 'Max', detail: '+350', color: '#3B82F6' }, // best at the distance
    ],
  }))}
  title={t.endScreen.recapTitle}
/>
```
