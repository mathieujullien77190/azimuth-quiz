import { useLocalSearchParams, useRouter } from 'expo-router';

import OnlineClueGameScreen from '@/games/clues/screens/OnlineClueGameScreen';

const CluesOnlineGameRoute = () => {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  return <OnlineClueGameScreen code={code} onQuit={() => router.back()} />;
};

export default CluesOnlineGameRoute;
