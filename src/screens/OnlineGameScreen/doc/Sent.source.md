```tsx
import { OnlineGameScreenView } from '@/screens/OnlineGameScreen/OnlineGameScreenView';

// Sent: `record` is set but not `confirmed`; `answered` says who is still missing and the footer waits for the others.
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
  answered={answered}
  confirmed={false}
  extraNeedles={extraNeedles}
  localIndex={myIndex}
  players={onlinePlayers}
  record={record}
  totals={totals}
  truthBearing={truthBearing}
/>
```
