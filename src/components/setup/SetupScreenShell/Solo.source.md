```tsx
import SetupScreenShell from '@/components/setup/SetupScreenShell';
import { useSetupRoom } from '@/components/setup/useSetupRoom';

const room = useSetupRoom(adapter, settings, updateSettings);

// The frame is shared; each game only supplies its own sections as `children`.
<SetupScreenShell
  backLabel={t.setup.back}
  onBack={onBack}
  onDismissOverlay={room.dismissOverlay}
  onStartPress={room.startOnlineGame}
  overlayMessage={room.overlayMessage}
  party={room.party}
  startDisabled={available === 0}
  startLabel={t.setup.start}
  title={t.setup.screenTitle}
>
  <DifficultySection {...difficultyProps} />
  <RoundsSection {...roundsProps} />
</SetupScreenShell>
```
