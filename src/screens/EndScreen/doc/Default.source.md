```tsx
import { EndScreenView } from '@/screens/EndScreen/EndScreenView';

// Le container calcule le classement et le meilleur de chaque manche (`roundBest`, `bestCell`) ; la vue les pose.
<EndScreenView
  columns={[t.roundResult.direction, t.roundResult.distance]}
  entries={[
    { name: 'Zoé', total: 1450, color: '#EF4444' },
    { name: 'Max', total: 1210, color: '#3B82F6' },
  ]}
  localName="Zoé"
  onQuit={onQuit}
  onReplay={onReplay}
  recapTitle={t.endScreen.recapTitle}
  rows={[{ label: 'Paris', cells: [{ text: 'Zoé', detail: '+400', color: '#EF4444' }, { text: 'Max', detail: '+350' }] }]}
  title={t.endScreen.title}
/>
```
