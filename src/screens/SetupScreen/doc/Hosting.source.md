```tsx
import { SetupScreenView } from '@/screens/SetupScreen/SetupScreenView';

// Host: `room.party` carries the room code and the players who joined; the host edits every section.
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
  overlayMessage={null}
  party={room.party}
  readOnly={false}
  ready
  settings={settings}
  startDisabled={false}
/>
```
