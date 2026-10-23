import { useLocalSearchParams, useRouter } from 'expo-router';

import { goBackOrHome } from '@/helpers/platform';

import SetupScreen from '@/screens/SetupScreen';

const SetupRoute = () => {
  const router = useRouter();
  // `?join=1` (bouton « Rejoindre » de l'accueil) ouvre directement la saisie du code.
  const { join } = useLocalSearchParams<{ join?: string }>();
  return <SetupScreen onBack={() => goBackOrHome(router)} startInJoin={join === '1'} />;
};

export default SetupRoute;
