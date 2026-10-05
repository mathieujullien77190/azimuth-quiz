```tsx
import ContourGuessBar from '@/games/contour/components/ContourGuessBar';

// Anybody can type a country at any time; only the turn-holder can validate it ("Valider" greyed out, and the
// keyboard's "done" says whose turn it is through `onNotYourTurn`).
<ContourGuessBar
  canSubmit={false}
  guessText={guessText}
  label={t.contourGame.guessLabel}
  onChangeGuessText={setGuessText}
  onNotYourTurn={notYourTurn.show}
  onSubmit={submitGuess}
/>
```
