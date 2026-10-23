```tsx
import { SetupScreenView } from '@/screens/SetupScreen/SetupScreenView';

// Solo: the container passes `room.party` as is; nothing is connected, every section is editable.
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
