import { useRouter } from 'expo-router';

import ContourSetupScreen from '@/games/contour/components/ContourSetupScreen';

const ContourSetupRoute = () => {
  const router = useRouter();
  return <ContourSetupScreen onBack={() => router.back()} onStart={() => router.push('/contour-game')} />;
};

export default ContourSetupRoute;
