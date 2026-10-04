import { useLocalSearchParams, useRouter } from 'expo-router';

import { goBackOrHome } from '@/helpers/goBack';

import OnlineGameScreen from '@/games/compass/screens/OnlineGameScreen';

const OnlineGameRoute = () => {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  return <OnlineGameScreen code={code} onQuit={() => goBackOrHome(router)} />;
};

export default OnlineGameRoute;
