```tsx
import ContourGuessBar from '@/games/contour/components/ContourGuessBar';

<ContourGuessBar
  guessText={guessText}
  onChangeGuessText={setGuessText}
  onHint={revealHint}
  onSubmit={submitGuess}
  wrongText={lastWrong !== null ? t.contourGame.wrongGuess(lastWrong) : null}
/>
```
