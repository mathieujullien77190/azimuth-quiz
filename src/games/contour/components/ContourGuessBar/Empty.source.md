```tsx
import ContourGuessBar from '@/games/contour/components/ContourGuessBar';

// The "Pays" label above the field; "Valider" checks the typed name. What an answer is worth sits in the header.
<ContourGuessBar
  guessText={guessText}
  label={t.contourGame.guessLabel}
  onChangeGuessText={setGuessText}
  onSubmit={submitGuess}
/>
```
