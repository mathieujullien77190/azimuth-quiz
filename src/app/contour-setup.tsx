import { useRouter } from 'expo-router';

import { goBackOrHome } from '@/helpers/goBack';

import ContourSetupScreen from '@/games/contour/screens/ContourSetupScreen';

const ContourSetupRoute = () => {
  const router = useRouter();
  return <ContourSetupScreen onBack={() => goBackOrHome(router)} />;
};

export default ContourSetupRoute;
