```tsx
import { useRouter } from 'expo-router';

import GameCard from '@/components/GameCard';
import { useTranslation } from '@/i18n';

export const CluesCard = () => {
  const router = useRouter();
  const t = useTranslation();

  return (
    <GameCard
      ctaLabel={t.home.games.clues.cta}
      icon="🧩"
      maxPlayers={10}
      onPress={() => router.push('/clues-setup')}
      tagline={t.home.games.clues.tagline}
      title={t.home.games.clues.title}
    />
  );
};
```
