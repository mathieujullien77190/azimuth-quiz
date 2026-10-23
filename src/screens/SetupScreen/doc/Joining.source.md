```tsx
import { SetupScreenView } from '@/screens/SetupScreen/SetupScreenView';

// Join chosen but no room joined yet: the container sets `readOnly` and the sections stay hidden until the code is valid.
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
  readOnly={true}
  ready
  settings={settings}
  startDisabled={false}
/>
```
