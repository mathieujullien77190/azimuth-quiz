import { useRouter } from 'expo-router';

import { goBackOrHome } from '@/helpers/goBack';

import SetupScreen from '@/games/compass/screens/SetupScreen';

const SetupRoute = () => {
  const router = useRouter();
  return <SetupScreen onBack={() => goBackOrHome(router)} />;
};

export default SetupRoute;
