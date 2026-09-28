```tsx
import SetupScreenShell from '@/components/setup/SetupScreenShell';
import { useSetupRoom } from '@/components/setup/useSetupRoom';

const room = useSetupRoom(adapter, settings, updateSettings);

// The frame is shared; each game only supplies its own sections as `children`.
<SetupScreenShell
  backLabel={t.setup.quit}
  onBack={onBack}
  onDismissOverlay={room.dismissOverlay}
  onStartPress={room.startOnlineGame}
  overlayMessage={room.overlayMessage}
  party={room.party}
  startDisabled={available === 0}
  startLabel={t.setup.start}
  icon={GAME_ICONS.compass}
  title={t.home.games.compass.title}
>
  <DifficultySection {...difficultyProps} />
  <RoundsSection {...roundsProps} />
</SetupScreenShell>
```
