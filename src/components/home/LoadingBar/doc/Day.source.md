```tsx
import LoadingBar from '@/components/home/LoadingBar';

// Meme composant : il suit le theme sauvegarde par les jetons du theme, un joueur en theme clair a le fond sable et la
// barre bleue sans rien changer.
<LoadingBar
  codename={{ emoji: '🐦', name: 'great-tit', wiki: 'https://en.wikipedia.org/wiki/Great_tit' }}
  fillMs={5000}
  loadingLabel={t.splash.loading}
  version="2.65.0"
/>
```
