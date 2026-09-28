```tsx
import { useRouter } from 'expo-router';

import GameCard from '@/components/GameCard';
import { useTranslation } from '@/i18n';

export const CompassCard = () => {
  const router = useRouter();
  const t = useTranslation();

  return (
    <GameCard
      ctaLabel={t.home.games.compass.cta}
      icon="🧭"
      maxPlayers={10}
      onPress={() => router.push('/setup')}
      tagline={t.home.games.compass.tagline}
      title={t.home.games.compass.title}
    />
  );
};
```
