```tsx
import VersionLine from '@/components/VersionLine';

// The splash screen and the About section draw it with their own text style; the animal's name opens its English
// Wikipedia article.
<VersionLine
  codename={{ emoji: '🐦', name: 'great-tit', wiki: 'https://en.wikipedia.org/wiki/Great_tit' }}
  version="2.65.0"
/>
```
