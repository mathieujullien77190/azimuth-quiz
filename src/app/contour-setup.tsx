import { useRouter } from 'expo-router';

import ContourSetupScreen from '@/games/contour/screens/ContourSetupScreen';

const ContourSetupRoute = () => {
  const router = useRouter();
  return <ContourSetupScreen onBack={() => router.back()} />;
};

export default ContourSetupRoute;
