import { useRouter } from 'expo-router';

import SetupScreen from '@/games/compass/screens/SetupScreen';

const SetupRoute = () => {
  const router = useRouter();
  return <SetupScreen onBack={() => router.back()} />;
};

export default SetupRoute;
