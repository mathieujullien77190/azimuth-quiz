import { useRouter } from 'expo-router';

import ContourSetupScreen from '@/components/ContourSetupScreen';

const ContourSetupRoute = () => {
  const router = useRouter();
  return <ContourSetupScreen onBack={() => router.back()} onStart={() => router.push('/contour-game')} />;
};

export default ContourSetupRoute;
