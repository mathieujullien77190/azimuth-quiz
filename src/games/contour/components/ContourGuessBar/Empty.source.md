```tsx
import ContourGuessBar from '@/games/contour/components/ContourGuessBar';

// The turn-holder's answer bar: 💡 reveals the next tier (and passes the turn), "Valider" checks the
// typed name.
<ContourGuessBar
  guessText={guessText}
  onChangeGuessText={setGuessText}
  onHint={revealHint}
  onSubmit={submitGuess}
/>
```
