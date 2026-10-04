import { useRouter } from 'expo-router';

import { goBackOrHome } from '@/helpers/goBack';

import ClueSetupScreen from '@/games/clues/screens/ClueSetupScreen';

const CluesSetupRoute = () => {
  const router = useRouter();
  return <ClueSetupScreen onBack={() => goBackOrHome(router)} />;
};

export default CluesSetupRoute;
