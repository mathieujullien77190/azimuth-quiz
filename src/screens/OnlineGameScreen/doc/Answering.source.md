```tsx
import { OnlineGameScreenView } from '@/screens/OnlineGameScreen/OnlineGameScreenView';

// Answer phase, heading page: no `record`, so the view shows the dial and the footer nav (`onCap` true).
<OnlineGameScreenView
  bearing={game.bearing}
  compassColor={myColor}
  difficulty={roomSettings.difficulty}
  distanceKm={game.distanceKm}
  earthMarks={earthMarks}
  maxDistanceKm={maxDistanceKm}
  name={name}
  onCap={onCap}
  onGoToCap={goToCap}
  onGoToDistance={goToDistance}
  onQuit={game.handleQuit}
  onReact={game.reactions.send}
  onScroll={handleScroll}
  onSetBearing={game.setBearing}
  onSetDistanceKm={game.setDistanceKm}
  onSubmit={game.submit}
  origin={roundOrigin}
  place={place}
  points={points}
  roomCode={code}
  roundNumber={roundIndex + 1}
  scrollRef={scrollRef}
  showCountry={roomSettings.showCountry}
  submitDisabled={!game.bearingTouched || !game.distanceTouched}
  totalRounds={places.length}
/>
```
