import { useRouter } from 'expo-router';

import ContourGameScreen from '@/games/contour/screens/ContourGameScreen';

const ContourGameRoute = () => {
  const router = useRouter();
  return <ContourGameScreen onQuit={() => router.replace('/')} />;
};

export default ContourGameRoute;
