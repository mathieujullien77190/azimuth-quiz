```tsx
import SetupScreenShell from '@/components/setup/SetupScreenShell';

// Same shell: with `party.onlineChoice === 'join'` it drops "Lancer la partie" by itself, and
// `overlayMessage` carries the read-only / kicked / room-deleted notices.
<SetupScreenShell
  backLabel={t.setup.back}
  onBack={onBack}
  onDismissOverlay={room.dismissOverlay}
  onStartPress={room.startOnlineGame}
  overlayMessage={room.overlayMessage}
  party={room.party}
  startDisabled={false}
  startLabel={t.setup.start}
  title={t.home.games.compass.title}
>
  {sections}
</SetupScreenShell>
```
