import { useLocalSearchParams, useRouter } from 'expo-router';

import { goBackOrHome } from '@/helpers/goBack';
import { useImmersiveNavigationBar } from '@/helpers/useImmersiveNavigationBar';

import OnlineContourGameScreen from '@/games/contour/screens/OnlineContourGameScreen';

const ContourOnlineGameRoute = () => {
  useImmersiveNavigationBar();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  return <OnlineContourGameScreen code={code} onQuit={() => goBackOrHome(router)} />;
};

export default ContourOnlineGameRoute;
