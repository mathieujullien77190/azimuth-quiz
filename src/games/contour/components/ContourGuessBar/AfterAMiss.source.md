```tsx
import ContourGuessBar from '@/games/contour/components/ContourGuessBar';

<ContourGuessBar
  guessText={guessText}
  onChangeGuessText={setGuessText}
  onSubmit={submitGuess}
  wrongText={lastWrong !== null ? t.contourGame.wrongGuess(lastWrong) : null}
/>
```
