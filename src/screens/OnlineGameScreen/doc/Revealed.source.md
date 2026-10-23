```tsx
import { OnlineGameScreenView } from '@/screens/OnlineGameScreen/OnlineGameScreenView';

// Reveal: `confirmed`, every needle and route plus the true one; the host gets the next-round button (`isHost`, `onNextRound`).
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
  confirmed
  extraNeedles={extraNeedles}
  isHost={isHost}
  isLastRound={isLastRound}
  localIndex={myIndex}
  location={travelLocation}
  onKick={game.kickPlayer}
  onNextRound={game.goToNextRound}
  players={onlinePlayers}
  record={record}
  totals={totals}
  truthBearing={truthBearing}
/>
```
