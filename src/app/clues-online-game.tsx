import { useLocalSearchParams, useRouter } from 'expo-router';

import { goBackOrHome } from '@/helpers/goBack';

import OnlineClueGameScreen from '@/games/clues/screens/OnlineClueGameScreen';

const CluesOnlineGameRoute = () => {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  return <OnlineClueGameScreen code={code} onQuit={() => goBackOrHome(router)} />;
};

export default CluesOnlineGameRoute;
