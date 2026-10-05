```tsx
import ContourGuessBar from '@/games/contour/components/ContourGuessBar';

// One guess per turn: the turn-holder already missed, so the label, the field and "Valider" are hidden and only the line
// says what is left to do (reveal a hint, which passes the hand).
<ContourGuessBar
  canSubmit={false}
  guessText={guessText}
  label={t.contourGame.guessLabel}
  lockedText={t.game.alreadyGuessed}
  onChangeGuessText={setGuessText}
  onSubmit={submitGuess}
/>
```
