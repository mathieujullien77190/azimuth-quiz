```tsx
import { OnlineGameScreenView } from '@/screens/OnlineGameScreen/OnlineGameScreenView';

// A guest whose host already started the next round: it stays on this result (`confirmed`) and moves on at its own pace with
// the button (`canContinue`, `onNextRound` = `game.advance`).
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
  canContinue={game.canContinue}
  isLastRound={isLastRound}
  localIndex={myIndex}
  location={travelLocation}
  onKick={game.kickPlayer}
  onNextRound={isHost ? game.goToNextRound : game.advance}
  players={onlinePlayers}
  record={record}
  totals={totals}
  truthBearing={truthBearing}
/>
```
