```tsx
import LoadingBar from '@/components/home/LoadingBar';

// Posee par l'accueil sur son pied, a la place des boutons, tant que l'app charge (un simple if, sans fondu). Elle avance
// par a-coups et se bloque comme un vrai chargement (`buildProgressSteps`), et finit sous 100 % sur le temps minimum.
<LoadingBar
  codename={{ emoji: '🐦', name: 'great-tit', wiki: 'https://en.wikipedia.org/wiki/Great_tit' }}
  fillMs={5000}
  loadingLabel={t.splash.loading}
  version="2.65.0"
/>
```
