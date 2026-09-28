```tsx
import PartySection from '@/components/setup/PartySection';

// A name another player already has is refused: `nameError` says so under the field, and `nameEditable`
// opens it up again until a free name is typed (both come from \`useSetupRoom\`).
<PartySection {...party} hint={t.setup.playersSection.hint} title={t.setup.playersSection.title} />
```
