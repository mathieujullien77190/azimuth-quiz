import { useLocalSearchParams, useRouter } from 'expo-router';

import OnlineContourGameScreen from '@/games/contour/screens/OnlineContourGameScreen';

const ContourOnlineGameRoute = () => {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  return <OnlineContourGameScreen code={code} onQuit={() => router.back()} />;
};

export default ContourOnlineGameRoute;
