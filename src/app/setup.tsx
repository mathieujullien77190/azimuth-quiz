import { useRouter } from 'expo-router';

import SetupScreen from '@/components/SetupScreen';

const SetupRoute = () => {
  const router = useRouter();
  return <SetupScreen onBack={() => router.back()} onStart={() => router.push('/game')} />;
};

export default SetupRoute;
