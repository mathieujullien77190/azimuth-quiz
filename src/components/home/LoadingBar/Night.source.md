```tsx
import LoadingBar from '@/components/home/LoadingBar';

// Posee par l'accueil sur son pied (a la place des boutons) tant que `useStartup().loading` est vrai : `loading` passe
// a faux quand l'app est prete et le temps minimum (5 s) ecoule, la barre se complete, s'efface et se retire. Elle
// avance par a-coups et se bloque comme un vrai chargement (`buildProgressSteps`), finit sous 100 % sur le temps minimum.
<LoadingBar
  codename={{ emoji: '🐦', name: 'great-tit', wiki: 'https://en.wikipedia.org/wiki/Great_tit' }}
  fillMs={5000}
  loading={loading}
  loadingLabel={t.splash.loading}
  version="2.65.0"
/>
```
