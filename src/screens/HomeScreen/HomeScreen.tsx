import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useStartup } from '@/store/startupStore';

import { HomeScreenView } from './HomeScreenView';

/**
 * Accueil, qui est aussi l'ecran de demarrage : titre, boussole dont l'aiguille oscille, puis au pied la barre de
 * chargement qui laisse la place aux boutons « Jouer » / « Rejoindre » une fois l'app prete. Le bouton reglages
 * (la mascotte) est toujours en haut.
 */
export const HomeScreen = () => {
  const router = useRouter();
  const loading = useStartup((state) => state.loading);
  // La barre n'existe que si l'accueil s'ouvre pendant le chargement (elle se retire seule apres sa liberation).
  const [showsBar] = useState(loading);

  return (
    <HomeScreenView
      loading={loading}
      onJoin={() => router.push({ pathname: '/setup', params: { join: '1' } })}
      onPlay={() => router.push('/setup')}
      onSettings={() => router.push('/settings')}
      showsBar={showsBar}
    />
  );
};
