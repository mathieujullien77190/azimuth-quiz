```tsx
import { SetupScreenView } from '@/screens/SetupScreen/SetupScreenView';

// Joined: settings come from the host's room, `readOnly` locks them and a tap shows the notice (`overlayMessage`).
<SetupScreenView
  available={available}
  onBack={onBack}
  onChangeCustomOrigin={onChangeCustomOrigin}
  onDismissOverlay={dismissOverlay}
  onSelectDifficulty={onSelectDifficulty}
  onSelectRounds={onSelectRounds}
  onStartPress={startOnlineGame}
  onToggleCategory={onToggleCategory}
  onToggleShowCountry={onToggleShowCountry}
  onToggleTravel={onToggleTravel}
  onToggleUseGps={onToggleUseGps}
  overlayLoading={false}
  overlayMessage={t.setup.readOnlyNotice}
  party={room.party}
  readOnly={true}
  ready
  settings={settings}
  startDisabled={false}
/>
```
