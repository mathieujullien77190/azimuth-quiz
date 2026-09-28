```tsx
import PartySection from '@/components/setup/PartySection';

// roomCode is still null right after "Héberger": the field shows a spinner until Firestore hands
// back the generated code.
<PartySection {...party} hint={t.setup.playersSection.hint} title={t.setup.playersSection.title} />
```
