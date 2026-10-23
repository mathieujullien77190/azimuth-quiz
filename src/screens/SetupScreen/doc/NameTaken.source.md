```tsx
import { SetupScreenView } from '@/screens/SetupScreen/SetupScreenView';

// The room refused the name: `room.party.nameError` is shown under the field and the field reopens.
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
