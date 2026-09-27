import { useRouter } from 'expo-router';

import ClueSetupScreen from '@/games/clues/screens/ClueSetupScreen';

const CluesSetupRoute = () => {
  const router = useRouter();
  return <ClueSetupScreen onBack={() => router.back()} onStart={() => router.push('/clues-game')} />;
};

export default CluesSetupRoute;
