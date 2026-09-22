import { useRouter } from 'expo-router';

import IndicesGameScreen from '@/components/IndicesGameScreen';

const IndicesGameRoute = () => {
  const router = useRouter();
  return <IndicesGameScreen onQuit={() => router.replace('/')} />;
};

export default IndicesGameRoute;
