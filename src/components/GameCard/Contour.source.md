```tsx
import { useRouter } from 'expo-router';

import GameCard from '@/components/GameCard';
import { useTranslation } from '@/i18n';

export const SilhouetteCard = () => {
  const router = useRouter();
  const t = useTranslation();

  return (
    <GameCard
      ctaLabel={t.home.games.contour.cta}
      icon="🗺️"
      maxPlayers={10}
      onPress={() => router.push('/contour-setup')}
      tagline={t.home.games.contour.tagline}
      title={t.home.games.contour.title}
    />
  );
};
```
