import { useLocalSearchParams, useRouter } from 'expo-router';

import { goBackOrHome } from '@/helpers/goBack';

import OnlineContourGameScreen from '@/games/contour/screens/OnlineContourGameScreen';

const ContourOnlineGameRoute = () => {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  return <OnlineContourGameScreen code={code} onQuit={() => goBackOrHome(router)} />;
};

export default ContourOnlineGameRoute;
