import { useRouter } from 'expo-router';

import IndicesGameScreen from '@/games/indices/components/IndicesGameScreen';

const IndicesGameRoute = () => {
  const router = useRouter();
  return <IndicesGameScreen onQuit={() => router.replace('/')} />;
};

export default IndicesGameRoute;
