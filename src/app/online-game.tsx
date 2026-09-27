import { useLocalSearchParams, useRouter } from 'expo-router';

import OnlineGameScreen from '@/components/OnlineGameScreen';

const OnlineGameRoute = () => {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  return <OnlineGameScreen code={code} onQuit={() => router.back()} />;
};

export default OnlineGameRoute;
