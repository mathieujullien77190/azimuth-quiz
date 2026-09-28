```tsx
import SetupScreenShell from '@/components/setup/SetupScreenShell';

// While the game starts, `useSetupRoom` turns `overlayLoading` on and `overlayMessage` into
// "Préparation de la partie…": the options stay on screen behind the splash instead of being
// replaced by a loading screen.
<SetupScreenShell
  backLabel={t.setup.back}
  onBack={onBack}
  onDismissOverlay={room.dismissOverlay}
  onStartPress={room.startOnlineGame}
  overlayLoading={room.overlayLoading}
  overlayMessage={room.overlayMessage}
  party={room.party}
  startDisabled={available === 0}
  startLabel={t.setup.start}
  title={t.setup.screenTitle}
>
  {sections}
</SetupScreenShell>
```
