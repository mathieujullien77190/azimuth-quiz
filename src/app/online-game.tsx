import { useLocalSearchParams, useRouter } from 'expo-router';

import { goBackOrHome } from '@/helpers/platform';
import { useImmersiveNavigationBar } from '@/helpers/hooks';

import OnlineGameScreen from '@/screens/OnlineGameScreen';

const OnlineGameRoute = () => {
  useImmersiveNavigationBar();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  return <OnlineGameScreen code={code} onQuit={() => goBackOrHome(router)} />;
};

export default OnlineGameRoute;
