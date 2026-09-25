import { useRouter } from 'expo-router';

import ContourGameScreen from '@/components/ContourGameScreen';

const ContourGameRoute = () => {
  const router = useRouter();
  return <ContourGameScreen onQuit={() => router.replace('/')} />;
};

export default ContourGameRoute;
