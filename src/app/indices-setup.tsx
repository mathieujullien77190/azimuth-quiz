import { useRouter } from 'expo-router';

import IndicesSetupScreen from '@/components/IndicesSetupScreen';

const IndicesSetupRoute = () => {
  const router = useRouter();
  return <IndicesSetupScreen onBack={() => router.back()} onStart={() => router.push('/indices-game')} />;
};

export default IndicesSetupRoute;
